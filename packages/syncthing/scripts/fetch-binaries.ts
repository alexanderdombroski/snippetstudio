import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ROOT = path.dirname(import.meta.dirname);
const BINARIES = path.join(ROOT, 'binaries');
const TEMP = path.join(ROOT, '.syncthing-downloads');

const VERSION = 'v2.1.3';
const ALPINE_VERSION = '2.1.3-r0';
const ALPINE_BRANCH = 'edge';
const ALPINE_BASE_URL = 'https://dl-cdn.alpinelinux.org/alpine';

/* A real Syncthing executable is several megabytes. */
const MIN_BINARY_SIZE = 1_000_000;

const TARGETS = {
	'win32-x64': `syncthing-windows-amd64-${VERSION}.zip`,
	'win32-arm64': `syncthing-windows-arm64-${VERSION}.zip`,
	'linux-x64': `syncthing-linux-amd64-${VERSION}.tar.gz`,
	'linux-arm64': `syncthing-linux-arm64-${VERSION}.tar.gz`,
	'linux-armhf': `syncthing-linux-arm-${VERSION}.tar.gz`,
	'alpine-x64': 'x86_64',
	'alpine-arm64': 'aarch64',
	'darwin-x64': `syncthing-macos-amd64-${VERSION}.zip`,
	'darwin-arm64': `syncthing-macos-arm64-${VERSION}.zip`,
} as const;

type Target = keyof typeof TARGETS;

function getBinaryName(target: Target): 'syncthing.exe' | 'syncthing' {
	return target.startsWith('win32') ? 'syncthing.exe' : 'syncthing';
}

async function download(url: string, destination: string): Promise<void> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Download failed: ${response.status} ${response.statusText}: ${url}`);
	}

	const data = await response.arrayBuffer();
	if (data.byteLength === 0) throw new Error(`Downloaded file is empty: ${url}`);

	await fs.mkdir(path.dirname(destination), { recursive: true });
	await fs.writeFile(destination, Buffer.from(data));
}

async function sha256(file: string): Promise<string> {
	const hash = crypto.createHash('sha256');
	hash.update(await fs.readFile(file));
	return hash.digest('hex');
}

async function ensureCommand(command: string): Promise<void> {
	try {
		await execFileAsync(process.platform === 'win32' ? 'where' : 'which', [command]);
	} catch {
		throw new Error(
			`Required command "${command}" not found. Install it before running this script.`
		);
	}
}

async function extractArchive(archive: string, destination: string): Promise<void> {
	await fs.mkdir(destination, { recursive: true });
	if (archive.endsWith('.zip')) {
		await execFileAsync('unzip', ['-q', archive, '-d', destination]);
	} else if (archive.endsWith('.tar.gz')) {
		await execFileAsync('tar', ['-xzf', archive, '-C', destination]);
	} else {
		throw new Error(`Unsupported archive format: ${archive}`);
	}
}

/**
 * Find a file by basename, checking files in the current directory before
 * recursing into subdirectories. This prevents small stub files nested deeper
 * (e.g. etc/firewall-ufw/syncthing) from being found before the real binary.
 */
async function findFile(directory: string, filename: string): Promise<string> {
	const entries = await fs.readdir(directory, { withFileTypes: true });

	// Check files first, before recursing into subdirectories.
	for (const entry of entries) {
		if (!entry.isFile() || entry.name !== filename) continue;
		const fullPath = path.join(directory, entry.name);
		const { size } = await fs.stat(fullPath);
		if (size < MIN_BINARY_SIZE) {
			throw new Error(
				`Found ${filename} but it is suspiciously small (${size} bytes, expected ≥${MIN_BINARY_SIZE}): ${fullPath}`
			);
		}
		return fullPath;
	}

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const result = await findFile(path.join(directory, entry.name), filename).catch(
			(error: unknown) => {
				// Propagate validation errors; swallow "not found" errors to keep searching.
				if (error instanceof Error && error.message.startsWith('Found ')) throw error;
				return null;
			}
		);
		if (result) return result;
	}

	throw new Error(`Could not find ${filename} inside ${directory}`);
}

async function downloadSyncthingArchive(archive: string): Promise<string> {
	const archivePath = path.join(TEMP, archive);
	try {
		const { size } = await fs.stat(archivePath);
		if (size > 0) return archivePath; // Already cached.
		await fs.rm(archivePath, { force: true });
	} catch {
		// Not downloaded yet.
	}
	await download(`https://release.syncthingcdn.net/${VERSION}/${archive}`, archivePath);
	return archivePath;
}

function parseApkIndex(
	indexText: string,
	packageName: string,
	version: string,
	architecture: string
): { checksum: string; size: number } {
	for (const record of indexText
		.split(/\n\n+/)
		.map((r) => r.trim())
		.filter(Boolean)) {
		const fields = new Map<string, string>();
		for (const line of record.split('\n')) {
			const sep = line.indexOf(':');
			if (sep !== -1) fields.set(line.slice(0, sep), line.slice(sep + 1));
		}
		if (
			fields.get('P') === packageName &&
			fields.get('V') === version &&
			fields.get('A') === architecture
		) {
			const checksum = fields.get('C');
			const size = Number(fields.get('S'));
			if (!checksum || !size) {
				throw new Error(`Incomplete APKINDEX record for ${packageName} ${version} ${architecture}`);
			}
			if (!Number.isSafeInteger(size) || size <= 0) {
				throw new Error(`Invalid APKINDEX package size: ${size}`);
			}
			return { checksum, size };
		}
	}
	throw new Error(`Could not find ${packageName} ${version} ${architecture} in APKINDEX`);
}

async function readApkInfo(
	apk: string
): Promise<{ packageName: string; version: string; architecture: string }> {
	const dir = path.join(TEMP, `pkginfo-${path.basename(apk)}`);
	await fs.rm(dir, { recursive: true, force: true });
	await fs.mkdir(dir, { recursive: true });
	await execFileAsync('tar', ['-xzf', apk, '-C', dir, '.PKGINFO']);
	const fields = new Map<string, string>();
	for (const line of (await fs.readFile(path.join(dir, '.PKGINFO'), 'utf8')).split('\n')) {
		const m = /^([^=]+) = (.*)$/.exec(line);
		if (m) fields.set(m[1].trim(), m[2].trim());
	}
	const packageName = fields.get('pkgname');
	const version = fields.get('pkgver');
	const architecture = fields.get('arch');
	if (!packageName || !version || !architecture) throw new Error(`Incomplete .PKGINFO in ${apk}`);
	return { packageName, version, architecture };
}

async function verifyAlpineApk(apk: string, architecture: string): Promise<void> {
	const indexPath = path.join(TEMP, `APKINDEX-${architecture}.tar.gz`);
	await download(
		`${ALPINE_BASE_URL}/${ALPINE_BRANCH}/community/${architecture}/APKINDEX.tar.gz`,
		indexPath
	);

	const indexDir = path.join(TEMP, `APKINDEX-${architecture}`);
	await fs.rm(indexDir, { recursive: true, force: true });
	await fs.mkdir(indexDir, { recursive: true });
	await execFileAsync('tar', ['-xzf', indexPath, '-C', indexDir, 'APKINDEX']);

	const indexInfo = parseApkIndex(
		await fs.readFile(path.join(indexDir, 'APKINDEX'), 'utf8'),
		'syncthing',
		ALPINE_VERSION,
		architecture
	);

	const actualSize = (await fs.stat(apk)).size;
	if (actualSize !== indexInfo.size) {
		throw new Error(
			`Alpine APK size mismatch: expected ${indexInfo.size}, got ${actualSize}: ${path.basename(apk)}`
		);
	}

	const pkgInfo = await readApkInfo(apk);
	if (pkgInfo.packageName !== 'syncthing') {
		throw new Error(`Unexpected package name: ${pkgInfo.packageName}`);
	}
	if (pkgInfo.version !== ALPINE_VERSION) {
		throw new Error(`Unexpected Alpine version: ${pkgInfo.version}`);
	}
	if (pkgInfo.architecture !== architecture) {
		throw new Error(`Unexpected architecture: ${pkgInfo.architecture}`);
	}
}

async function installBinary(source: string, target: Target, binaryName: string): Promise<void> {
	const targetDir = path.join(BINARIES, target);
	await fs.rm(targetDir, { recursive: true, force: true });
	await fs.mkdir(targetDir, { recursive: true });
	const destination = path.join(targetDir, binaryName);
	await fs.copyFile(source, destination);
	if (!target.startsWith('win32')) await fs.chmod(destination, 0o755);
	const { size } = await fs.stat(destination);
	if (size < MIN_BINARY_SIZE) {
		throw new Error(`Installed binary is suspiciously small (${size} bytes): ${destination}`);
	}
}

async function processSyncthingArchive(target: Target, archive: string): Promise<void> {
	const binaryName = getBinaryName(target);
	console.log(target, `downloading ${archive}`);
	const archivePath = await downloadSyncthingArchive(archive);

	const extractionDir = path.join(TEMP, `extract-${target}`);
	await fs.rm(extractionDir, { recursive: true, force: true });
	await extractArchive(archivePath, extractionDir);

	const binary = await findFile(extractionDir, binaryName);
	const { size } = await fs.stat(binary);
	console.log(target, `extracted ${(size / 1e6).toFixed(1)} MB`);
	await installBinary(binary, target, binaryName);
	const hash = await sha256(path.join(BINARIES, target, binaryName));
	console.log(target, `✓ sha256:${hash}`);
}

async function processAlpine(target: Target, architecture: string): Promise<void> {
	const apkName = `syncthing-${ALPINE_VERSION}.apk`;
	const apkPath = path.join(TEMP, `${architecture}-${apkName}`);
	const url = `${ALPINE_BASE_URL}/${ALPINE_BRANCH}/community/${architecture}/${apkName}`;
	console.log(target, `downloading ${apkName}…`);
	await download(url, apkPath);
	console.log(target, `verifying…`);
	await verifyAlpineApk(apkPath, architecture);
	const extractionDir = path.join(TEMP, `alpine-${target}`);
	await fs.rm(extractionDir, { recursive: true, force: true });
	await fs.mkdir(extractionDir, { recursive: true });
	await execFileAsync('tar', [
		'-xzf',
		apkPath,
		'-C',
		extractionDir,
		'--strip-components=2',
		'usr/bin/syncthing',
	]);
	const binary = path.join(extractionDir, 'syncthing');
	const { size } = await fs.stat(binary);
	if (size < MIN_BINARY_SIZE) throw new Error(`Alpine binary too small: ${size} bytes`);
	console.log(target, `extracted ${(size / 1e6).toFixed(1)} MB`);
	await installBinary(binary, target, 'syncthing');
	const hash = await sha256(path.join(BINARIES, target, 'syncthing'));
	console.log(target, `✓ sha256:${hash}`);
}

async function main(): Promise<void> {
	console.log(`Syncthing ${VERSION} binary downloader\n`);

	await fs.rm(TEMP, { recursive: true, force: true });
	await fs.mkdir(TEMP, { recursive: true });
	await fs.mkdir(BINARIES, { recursive: true });
	await ensureCommand('tar');
	await ensureCommand('unzip');

	const entries = Object.entries(TARGETS) as [Target, (typeof TARGETS)[Target]][];

	const results = await Promise.allSettled(
		entries.map(([target, downloadKind]) =>
			target.startsWith('alpine')
				? processAlpine(target, downloadKind)
				: processSyncthingArchive(target, downloadKind)
		)
	);

	let failed = false;
	for (const [i, result] of results.entries()) {
		if (result.status === 'rejected') {
			console.error(`[${entries[i][0]}] FAILED: ${result.reason}`);
			failed = true;
		}
	}

	if (failed) {
		process.exitCode = 1;
		return;
	}

	console.log('\nFinal verification:');
	for (const target of Object.keys(TARGETS) as Target[]) {
		const binary = path.join(BINARIES, target, getBinaryName(target));
		const { size } = await fs.stat(binary);
		if (size < MIN_BINARY_SIZE) {
			throw new Error(`${target}: binary is suspiciously small (${size} bytes)`);
		}
		console.log(`  ✓ ${target}: ${size.toLocaleString()} bytes`);
	}

	await fs.rm(TEMP, { recursive: true, force: true });
	console.log('\nAll Syncthing binaries downloaded successfully.');
}

main().catch((error) => {
	console.error(`\nERROR: ${error}`);
	process.exitCode = 1;
});
