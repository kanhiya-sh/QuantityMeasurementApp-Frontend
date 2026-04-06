import { Injectable } from '@angular/core';
import { MeasurementType } from '../models/measurement.types';

@Injectable({ providedIn: 'root' })
export class UnitService {
  /**
   * FIX: Unit names must exactly match backend enum values (case-insensitive).
   * Backend does unit.toUpperCase() and calls Enum.valueOf().
   *
   * LengthUnit10:  FEET, INCHES, YARDS, CENTIMETERS, METER, KILOMETER
   * WeightUnit10:  KILOGRAM, GRAM, POUND
   * TemperatureUnit: CELSIUS, FAHRENHEIT
   * VolumeUnit:    LITRE, MILLILITRE, GALLON
   */
  readonly unitsByType: Record<MeasurementType, string[]> = {
    Length:      ['Feet', 'Inches', 'Yards', 'Centimeters', 'Meter', 'Kilometer'],
    Weight:      ['Kilogram', 'Gram', 'Pound'],
    Temperature: ['Celsius', 'Fahrenheit'],
    Volume:      ['Litre', 'Millilitre', 'Gallon'],
  };
}