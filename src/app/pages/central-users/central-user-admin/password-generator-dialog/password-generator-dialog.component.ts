import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from "ng-zorro-antd/message";

export interface PasswordGeneratorDialogData {
    userCount: number;
    systemCount: number;
    operationType: 'reset' | 'deactivate';
}

export interface PasswordGeneratorDialogResult {
    confirmed: boolean;
    password?: string;
}

export interface PasswordOptions {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeDigits: boolean;
    includeSymbols: boolean;
}

@Component({
    standalone: false,
    selector: 'app-password-generator-dialog',
    templateUrl: './password-generator-dialog.component.html'
})
export class PasswordGeneratorDialogComponent implements OnInit {

    options: PasswordOptions = {
        length: 12,
        includeUppercase: true,
        includeLowercase: true,
        includeDigits: true,
        includeSymbols: true
    };

    generatedPassword = '';
    showPassword = false;

    // Character sets
    private readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
    private readonly DIGITS = '0123456789';
    private readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    constructor(
        public modal: NzModalRef,
        @Inject(NZ_MODAL_DATA) public data: PasswordGeneratorDialogData,
        private messageService: NzMessageService
    ) { }

    ngOnInit(): void {
        this.generatePassword();
    }

    generatePassword(): void {
        let charset = '';

        if (this.options.includeUppercase) charset += this.UPPERCASE;
        if (this.options.includeLowercase) charset += this.LOWERCASE;
        if (this.options.includeDigits) charset += this.DIGITS;
        if (this.options.includeSymbols) charset += this.SYMBOLS;

        if (charset.length === 0) {
            this.messageService.error('Please select at least one character type');
            return;
        }

        let password = '';

        // Ensure at least one character from each selected type
        if (this.options.includeUppercase) {
            password += this.getRandomChar(this.UPPERCASE);
        }
        if (this.options.includeLowercase) {
            password += this.getRandomChar(this.LOWERCASE);
        }
        if (this.options.includeDigits) {
            password += this.getRandomChar(this.DIGITS);
        }
        if (this.options.includeSymbols) {
            password += this.getRandomChar(this.SYMBOLS);
        }

        // Fill the rest with random characters from the combined charset
        const remainingLength = this.options.length - password.length;
        for (let i = 0; i < remainingLength; i++) {
            password += this.getRandomChar(charset);
        }

        // Shuffle the password to avoid predictable patterns
        this.generatedPassword = this.shuffleString(password);
    }

    private getRandomChar(charset: string): string {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return charset[array[0] % charset.length];
    }

    private shuffleString(str: string): string {
        const array = str.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const randomArray = new Uint32Array(1);
            crypto.getRandomValues(randomArray);
            const j = randomArray[0] % (i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.join('');
    }

    copyPassword(): void {
        if (this.generatedPassword) {
            navigator.clipboard.writeText(this.generatedPassword).then(() => {
                this.messageService.success('Password copied to clipboard');
            }).catch(err => {
                this.messageService.error('Failed to copy password');
            });
        }
    }

    toggleShowPassword(): void {
        this.showPassword = !this.showPassword;
    }

    onLengthChange(val: number): void {
        if (val < 8) this.options.length = 8;
        if (val > 64) this.options.length = 64;
        this.generatePassword();
    }

    onOptionChange(): void {
        this.generatePassword();
    }

    getTitle(): string {
        return this.data.operationType === 'reset' ? 'Reset Password' : 'Deactivate Password';
    }

    getMessage(): string {
        if (this.data.operationType === 'reset') {
            return `Generate a new password for ${this.data.userCount} user(s) across ${this.data.systemCount} system(s). This will also unlock the user accounts.`;
        }
        return `Deactivate password for ${this.data.userCount} user(s) across ${this.data.systemCount} system(s). Users will be forced to change password on next login.`;
    }

    getStrengthLabel(): string {
        const length = this.options.length;
        const typesCount = [
            this.options.includeUppercase,
            this.options.includeLowercase,
            this.options.includeDigits,
            this.options.includeSymbols
        ].filter(Boolean).length;

        if (length >= 16 && typesCount >= 4) return 'Very Strong';
        if (length >= 12 && typesCount >= 3) return 'Strong';
        if (length >= 10 && typesCount >= 2) return 'Medium';
        return 'Weak';
    }

    getStrengthColor(): string {
        const label = this.getStrengthLabel();
        switch (label) {
            case 'Very Strong': return 'success';
            case 'Strong': return 'processing';
            case 'Medium': return 'warning';
            default: return 'error';
        }
    }

    cancel(): void {
        this.modal.close({ confirmed: false });
    }

    confirm(): void {
        if (!this.generatedPassword) {
            this.messageService.error('Please generate a password first');
            return;
        }
        this.modal.destroy({
            confirmed: true,
            password: this.generatedPassword
        });
    }
}
