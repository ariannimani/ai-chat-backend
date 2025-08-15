export class UsernameGenerator {
  private static readonly ADJECTIVES = [
    'amazing',
    'brave',
    'clever',
    'daring',
    'elegant',
    'fierce',
    'gentle',
    'happy',
    'incredible',
    'joyful',
    'kind',
    'lovely',
    'mighty',
    'noble',
    'optimistic',
    'peaceful',
    'quick',
    'radiant',
    'strong',
    'talented',
    'unique',
    'vibrant',
    'wise',
    'excellent',
    'youthful',
    'zealous',
    'brilliant',
    'creative',
    'dynamic',
    'energetic',
    'fantastic',
    'graceful',
    'heroic',
    'inspiring',
    'luminous',
    'marvelous',
    'outstanding',
    'perfect',
    'remarkable',
    'spectacular',
    'triumphant',
    'wonderful',
  ];

  private static readonly NOUNS = [
    'tiger',
    'eagle',
    'dolphin',
    'phoenix',
    'dragon',
    'lion',
    'falcon',
    'wolf',
    'bear',
    'shark',
    'panther',
    'hawk',
    'fox',
    'owl',
    'rabbit',
    'deer',
    'horse',
    'cat',
    'dog',
    'bird',
    'fish',
    'turtle',
    'butterfly',
    'bee',
    'spider',
    'ant',
    'whale',
    'octopus',
    'penguin',
    'koala',
    'panda',
    'elephant',
    'giraffe',
    'zebra',
    'rhino',
    'hippo',
    'crocodile',
    'snake',
    'lizard',
    'frog',
    'monkey',
    'gorilla',
    'cheetah',
    'jaguar',
  ];

  /**
   * Generates a random username in the format: adjective_noun_randomNumber
   * Example: brave_tiger_123
   */
  static generate(): string {
    const adjective = this.getRandomElement(this.ADJECTIVES);
    const noun = this.getRandomElement(this.NOUNS);
    const randomNumber = Math.floor(Math.random() * 9999) + 1;

    return `${adjective}_${noun}_${randomNumber}`;
  }

  /**
   * Generates a random username with a custom suffix
   * Example: clever_eagle_user
   */
  static generateWithSuffix(suffix: string): string {
    const adjective = this.getRandomElement(this.ADJECTIVES);
    const noun = this.getRandomElement(this.NOUNS);

    return `${adjective}_${noun}_${suffix}`;
  }

  /**
   * Generates a simple random username (adjective + noun only)
   * Example: mighty_falcon
   */
  static generateSimple(): string {
    const adjective = this.getRandomElement(this.ADJECTIVES);
    const noun = this.getRandomElement(this.NOUNS);

    return `${adjective}_${noun}`;
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Validates if a username meets basic requirements
   */
  static isValid(username: string): boolean {
    // Username should be 3-50 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
  }

  /**
   * Generates multiple unique username suggestions
   */
  static generateMultiple(count: number = 5): string[] {
    const usernames = new Set<string>();

    while (usernames.size < count) {
      usernames.add(this.generate());
    }

    return Array.from(usernames);
  }
}
