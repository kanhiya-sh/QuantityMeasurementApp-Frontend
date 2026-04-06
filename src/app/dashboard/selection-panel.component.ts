import { Component, input, output } from '@angular/core';
import { ActionKind, MeasurementType } from '../models/measurement.types';

@Component({
  selector: 'app-selection-panel',
  standalone: true,
  templateUrl: './selection-panel.component.html',
  styleUrl: './selection-panel.component.scss',
})
export class SelectionPanelComponent {
  readonly types: MeasurementType[] = ['Length', 'Weight', 'Temperature', 'Volume'];
  readonly actions: ActionKind[] = ['Comparison', 'Conversion', 'Arithmetic'];

  selectedType = input.required<MeasurementType>();
  selectedAction = input.required<ActionKind>();

  typeChange = output<MeasurementType>();
  actionChange = output<ActionKind>();
}
