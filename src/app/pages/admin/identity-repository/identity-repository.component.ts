import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-identity-repository',
  template: `<router-outlet></router-outlet>`,
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class IdentityRepositoryComponent {}
