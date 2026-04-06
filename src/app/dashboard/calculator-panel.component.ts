import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActionKind, ArithmeticOp } from '../models/measurement.types';

@Component({
  selector: 'app-calculator-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calculator-panel.component.html',
  styleUrl: './calculator-panel.component.scss',
})
export class CalculatorPanelComponent {
  action = input.required<ActionKind>();
  units = input.required<string[]>();
  loading = input(false);

  value1 = input.required<number | null>();
  value2 = input.required<number | null>();
  unit1 = input.required<string>();
  unit2 = input.required<string>();
  operation = input.required<ArithmeticOp>();

  value1Change = output<number | null>();
  value2Change = output<number | null>();
  unit1Change = output<string>();
  unit2Change = output<string>();
  operationChange = output<ArithmeticOp>();

  calculate = output<void>();

  readonly ops: ArithmeticOp[] = ['Add', 'Subtract', 'Divide'];
}
