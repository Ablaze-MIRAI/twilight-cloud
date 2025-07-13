import type { IPublisher } from "$lib/server/publisher/core";
import type { PublisherConfig } from "$lib/types";

export class PublishService {
    constructor(
        private readonly config: Map<number, PublisherConfig>,
        private readonly publishers: Map<string, IPublisher>
    ) {}

    public getPublisherConfig(): Map<number, PublisherConfig> {
        return this.config;
    }

}