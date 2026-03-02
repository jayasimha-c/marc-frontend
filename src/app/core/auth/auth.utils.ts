export class AuthUtils {

  static isTokenExpired(token: string): boolean {
    if (!token) {
      return true;
    }

    const expiry = this.getTokenExpirationDate(token);
    if (!expiry) {
      return false;
    }

    return expiry.valueOf() <= new Date().valueOf();
  }

  private static getTokenExpirationDate(token: string): Date | null {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp === undefined) {
        return null;
      }
      const date = new Date(0);
      date.setUTCSeconds(decoded.exp);
      return date;
    } catch {
      return null;
    }
  }

  static decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
