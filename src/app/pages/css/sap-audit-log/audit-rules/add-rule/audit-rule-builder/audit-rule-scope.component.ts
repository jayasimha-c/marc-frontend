import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AuditRuleScope, createDefaultScope } from "./audit-rule-builder.model";

@Component({
    standalone: false,
    selector: "audit-rule-scope",
    template: `
        <div class="scope-grid">
            <!-- Event Codes -->
            <div class="scope-field">
                <label class="field-label">Event Codes</label>
                <input nz-input class="compact-field"
                       [value]="scope.events"
                       (input)="onFieldChange('events', $event)"
                       placeholder="e.g. AU1, AU5 (blank = all)">
            </div>

            <!-- Client -->
            <div class="scope-field">
                <label class="field-label">Client</label>
                <input nz-input class="compact-field"
                       [value]="scope.client"
                       (input)="onFieldChange('client', $event)"
                       placeholder="e.g. 100">
            </div>

            <!-- Message Contains -->
            <div class="scope-field">
                <label class="field-label">Message Contains</label>
                <input nz-input class="compact-field"
                       [value]="scope.message"
                       (input)="onFieldChange('message', $event)"
                       placeholder="Keyword in audit message">
            </div>

            <!-- Business Hours -->
            <div class="scope-field">
                <label class="field-label">Business Hours</label>
                <div class="hours-row">
                    <nz-select class="hours-field compact-field"
                               [ngModel]="scope.hoursFrom"
                               (ngModelChange)="onHoursChange('hoursFrom', $event)"
                               nzPlaceHolder="From">
                        <nz-option nzValue="" nzLabel="From"></nz-option>
                        <nz-option *ngFor="let hour of hours" [nzValue]="hour.value" [nzLabel]="hour.label"></nz-option>
                    </nz-select>
                    <span class="hours-separator">to</span>
                    <nz-select class="hours-field compact-field"
                               [ngModel]="scope.hoursTo"
                               (ngModelChange)="onHoursChange('hoursTo', $event)"
                               nzPlaceHolder="To">
                        <nz-option nzValue="" nzLabel="To"></nz-option>
                        <nz-option *ngFor="let hour of hours" [nzValue]="hour.value" [nzLabel]="hour.label"></nz-option>
                    </nz-select>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .scope-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .scope-field {
            display: flex;
            flex-direction: column;
        }
        .field-label {
            font-size: 10px;
            font-weight: 500;
            color: rgba(0,0,0,0.45);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .full-width {
            width: 100%;
        }
        .compact-field {
            margin: 0;
            font-size: 12px;
        }
        input.compact-field {
            font-family: var(--font-code);
            height: 32px;
            padding: 4px 10px;
        }
        .hours-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .hours-field {
            flex: 1;
        }
        .hours-separator {
            font-size: 10px;
            color: rgba(0,0,0,0.25);
        }
    `]
})
export class AuditRuleScopeComponent implements OnChanges {

    @Input() scope: AuditRuleScope = createDefaultScope();
    @Output() scopeChange = new EventEmitter<AuditRuleScope>();

    // Generate hours array: value is plain number string (matches old filter format), label is display text
    hours: { value: string; label: string }[] = Array.from({ length: 24 }, (_, i) => {
        const ampm = i < 12 ? 'AM' : 'PM';
        const displayHour = i % 12 === 0 ? 12 : i % 12;
        return { value: i.toString(), label: `${displayHour} ${ampm}` };
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['scope'] && !this.scope) {
            this.scope = createDefaultScope();
        }
    }

    onFieldChange(field: keyof AuditRuleScope, event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.emitChange({ ...this.scope, [field]: value });
    }

    onHoursChange(field: 'hoursFrom' | 'hoursTo', value: string): void {
        this.emitChange({ ...this.scope, [field]: value });
    }

    private emitChange(newScope: AuditRuleScope): void {
        this.scopeChange.emit(newScope);
    }
}
