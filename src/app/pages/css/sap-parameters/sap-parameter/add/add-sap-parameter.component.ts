import { Location } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../../core/services/notification.service';
import { RuleStateService } from '../../../css-shared/previous-state.service';
import { AddSapParameterTypeNames, SapParameter } from '../../sap-parameter.model';
import { SapParameterService } from '../../sap-parameters.service';

@Component({
  standalone: false,
  selector: 'app-add-sap-parameter',
  templateUrl: './add-sap-parameter.component.html',
})
export class AddSapParameterComponent implements OnInit, OnChanges {
  @Input() parameter: SapParameter;
  @Input() formType: 'add' | 'edit' | 'view';

  parameterTypeOptions = Object.entries(AddSapParameterTypeNames);

  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private sapParameterService: SapParameterService,
    private notificationService: NotificationService,
    private location: Location,
    private stateService: RuleStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      parameterName: ['', [Validators.required]],
      description: [''],
      parameterType: ['SAP_PARAMETER', [Validators.required]],
      minSapVersion: [''],
    });

    if (this.parameter == null && history.state.parameter != null) {
      this.parameter = history.state.parameter;
    }
    if (this.formType == null && history.state.formType != null) {
      this.formType = history.state.formType;
    }

    if (this.formType === 'edit' || this.formType === 'view') {
      this.form.patchValue({
        parameterName: this.parameter.parameterName,
        description: this.parameter.description,
        minSapVersion: this.parameter.minSapVersion,
        parameterType: this.parameter.parameterType,
      });
    }
    if (this.formType === 'view') {
      this.form.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formType']?.currentValue === 'view') {
      this.form.disable();
    }
    if (changes['parameter']?.currentValue) {
      this.parameter = changes['parameter'].currentValue;
      this.form.patchValue({
        parameterName: this.parameter.parameterName,
        description: this.parameter.description,
        minSapVersion: this.parameter.minSapVersion,
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const parameter: SapParameter = {
      id: this.formType === 'edit' ? this.parameter.id : null,
      parameterName: this.form.get('parameterName')!.value,
      description: this.form.get('description')!.value,
      minSapVersion: this.form.get('minSapVersion')!.value,
      parameterType: this.form.get('parameterType')!.value,
    };

    this.sapParameterService.saveSapParameter(parameter).subscribe((response) => {
      this.notificationService.show(response);
      if (this.stateService.hasState()) {
        this.stateService.setChildResource(response.data);
      }
      this.location.back();
    });
  }

  onBack(): void {
    this.location.back();
  }

  navigateBack(): void {
    this.router.navigate(['/css/sap-parameters/sap-parameter']);
  }
}
