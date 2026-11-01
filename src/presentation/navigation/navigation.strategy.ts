
export interface NavigationStrategy {
  redirect(url: string): void;
}

export class WindowNavigationStrategy implements NavigationStrategy {
  redirect(url: string): void {
    window.location.href = url;
  }
}

export class NoopNavigationStrategy implements NavigationStrategy {
  redirect(_url: string): void {
    /* intentionally no-op */
  }
}
