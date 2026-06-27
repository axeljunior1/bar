export function capitalizeSentence(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function capitalizeWords(value: string): string {
  if (!value) {
    return value;
  }

  return value.replace(/(?:^|\s)\S/g, (character) => character.toUpperCase());
}

export function formatNameInput(value: string): string {
  return capitalizeWords(value.trim());
}

export function formatNoteInput(value: string): string {
  return capitalizeSentence(value.trim());
}
