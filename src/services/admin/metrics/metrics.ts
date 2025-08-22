import { MetricController } from './metrics.controller';

export class MetricClient {
  private metricController: MetricController;

  constructor() {
    this.metricController = new MetricController();
  }
}
