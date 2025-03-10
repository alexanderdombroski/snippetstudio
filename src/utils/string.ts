function titleCase(str: string): string {
    return str.split(' ').map(w => capitalize(w)).join(' ');
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export { titleCase };