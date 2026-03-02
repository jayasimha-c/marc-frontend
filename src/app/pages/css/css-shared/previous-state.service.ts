import { Injectable } from '@angular/core';

class GenericStateService<PreviousState, ChildResource> {
  private previousState: PreviousState | null = null;
  private childResource: ChildResource | null = null;

  setPreviousState(state: PreviousState): void {
    this.previousState = state;
  }

  getPreviousState(): PreviousState | null {
    return this.previousState;
  }

  setChildResource(resource: ChildResource): void {
    this.childResource = resource;
  }

  getChildResource(): ChildResource | null {
    return this.childResource;
  }

  hasState(): boolean {
    return this.previousState != null;
  }

  hasChildResource(): boolean {
    return this.childResource != null;
  }

  clearState(): void {
    this.previousState = null;
    this.childResource = null;
  }
}

@Injectable({ providedIn: 'root' })
export class RuleStateService extends GenericStateService<any, any> {}

@Injectable({ providedIn: 'root' })
export class RuleBookStateService extends GenericStateService<any, { audit: any; parameter: any }> {}
