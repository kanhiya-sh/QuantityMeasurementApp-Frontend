export type MeasurementType = 'Length' | 'Weight' | 'Temperature' | 'Volume';

export type ActionKind = 'Comparison' | 'Conversion' | 'Arithmetic';

export type ArithmeticOp = 'Add' | 'Subtract' | 'Divide';

export interface User {
  fullName: string;
  email: string;
  password: string;
  mobile?: string;
}

export interface LastSelection {
  type: MeasurementType;
  action: ActionKind;
  operation: ArithmeticOp;
  unit1: string;
  unit2: string;
  value1: number | null;
  value2: number | null;
}
