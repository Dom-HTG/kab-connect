import { MetricService } from './metrics.service';

export class MetricController {
  private metricService: MetricService;

  constructor() {
    this.metricService = new MetricService();
  }
}
