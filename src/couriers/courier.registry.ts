import { AppError } from '../errors/app-error';
import { ICourierAdapter } from './courier.interface';
import { MockCourierAdapter } from './mockcourier/mockcourier.adapter';
import { UrbaneBoltAdapter } from './urbanebolt/urbanebolt.adapter';

export class CourierRegistry {
  private readonly adapters = new Map<string, ICourierAdapter>();

  constructor() {
    this.adapters.set('urbanebolt', new UrbaneBoltAdapter());
    this.adapters.set('mockcourier', new MockCourierAdapter());
  }

  getAdapter(name: string): ICourierAdapter {
    const adapter = this.adapters.get(name.toLowerCase());
    if (!adapter) {
      throw new AppError('UNKNOWN_COURIER', `Unsupported courier_partner: ${name}. Supported couriers: urbanebolt, mockcourier`, 400, [{
        field: 'courier_partner',
        message: 'Unsupported courier partner',
      }]);
    }
    return adapter;
  }
}

export const courierRegistry = new CourierRegistry();
