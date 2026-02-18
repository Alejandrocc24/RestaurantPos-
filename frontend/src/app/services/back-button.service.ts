import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BackButtonService implements OnDestroy {
  private navigationStack: string[] = [];
  private routerSub?: Subscription;
  private popStateHandler = (event: PopStateEvent) => this.handlePopState(event);

  constructor(private router: Router, private authService: AuthService) {
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        if (this.isLoginRoute(url)) {
          return;
        }

        if (!this.navigationStack.length || this.navigationStack[this.navigationStack.length - 1] !== url) {
          this.navigationStack.push(url);
        }

        this.ensureHistoryState();
      });

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.popStateHandler);
      this.ensureHistoryState();
    }
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.popStateHandler);
    }
  }

  private handlePopState(event: PopStateEvent): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    event.preventDefault?.();

    if (typeof history !== 'undefined') {
      history.pushState(null, '', window.location.href);
    }

    if (this.navigationStack.length > 1) {
      this.navigationStack.pop();
      const previousUrl = this.navigationStack[this.navigationStack.length - 1];
      this.router.navigateByUrl(previousUrl, { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true, queryParams: { view: 'mesas' } });
    }
  }

  private ensureHistoryState(): void {
    if (typeof history !== 'undefined') {
      history.pushState(null, '', window.location.href);
    }
  }

  private isLoginRoute(url: string): boolean {
    return url === '/login' || url.startsWith('/login?');
  }
}
