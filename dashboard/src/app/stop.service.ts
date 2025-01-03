import {inject, Injectable} from '@angular/core';
import {Stop} from './types';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {BASE_URL} from './app.config';

@Injectable({
    providedIn: 'root',
})
export class StopService {
    httpClient = inject(HttpClient);
    baseUrl = inject(BASE_URL);

    constructor() {
    }

    public async getStops(): Promise<Stop[]> {
      return firstValueFrom(this.httpClient.get<Stop[]>(this.baseUrl + '/api/stops', {
        headers: {
          'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
        }
      }))
    }
/*
    public async getPrivateStops() {
        return firstValueFrom(
            this.httpClient.get<Stop[]>(this.baseUrl + '/api/stops/private', {
                headers: {
                    'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
                },
            })
        );
    }

    async getStopsByid(id: number): Promise<Stop[]> {
        return firstValueFrom(
            this.httpClient.get<Stop[]>(this.baseUrl + `/stops/groups/${id}`)
        );
    }

    updateStopOrder(stops: number[]) {
        firstValueFrom(
            this.httpClient.put(
                this.baseUrl + '/api/stops/order', { order: stops }, {
                    headers: {
                        'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
                    },
                }
            )
        );
    }

    async updateStopid(stop: Stop) {
        return await firstValueFrom(
            this.httpClient.put(
                this.baseUrl + `/api/stops/` + stop.id,
                {
                    name: stop.name,
                    description: stop.description,
                    roomNr: stop.roomNr,
                    id: stop.id,
                    id: stop.id,
                },
                {
                    headers: {
                        'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
                    },
                }
            )
        );
    }

    async addStop(stop: {
        name: string;
        description: string;
        roomNr: string;
        id: number;
    }) {
        await firstValueFrom(
            this.httpClient.post(this.baseUrl + '/api/stops', stop, {
                headers: {
                    'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
                },
            })
        );
    }

    async updateStop(stop: Stop) {
        await firstValueFrom(
            this.httpClient.put(this.baseUrl + `/api/stops/${stop.id}`, stop, {
                headers: {
                    'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
                },
            })
        );
    }

    async deleteStop(id: number) {
        await firstValueFrom(
            this.httpClient.delete(this.baseUrl + `/api/stops/${id}`, {
                headers: {
                    'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
                },
            })
        );
    }*/
}
