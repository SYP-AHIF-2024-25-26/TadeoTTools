import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from '@/app.config';
import {
  Buffet,
  BuffetProduct,
  CashMovement,
  LegacyBuffetImport,
  Sales,
  SalesStatistics,
  SaveBuffetProductRequest,
  SaveBuffetRequest,
} from '@/shared/models/types';

// Products, buffets and sales of the cashier kiosk (admin only).
@Injectable({
  providedIn: 'root',
})
export class BuffetService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL);

  getProducts(): Promise<BuffetProduct[]> {
    return firstValueFrom(
      this.httpClient.get<BuffetProduct[]>(`${this.baseUrl}/api/products`)
    );
  }

  addProduct(product: SaveBuffetProductRequest): Promise<BuffetProduct> {
    return firstValueFrom(
      this.httpClient.post<BuffetProduct>(
        `${this.baseUrl}/api/products`,
        product
      )
    );
  }

  updateProduct(id: number, product: SaveBuffetProductRequest): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/products/${id}`, product)
    );
  }

  deleteProduct(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/products/${id}`)
    );
  }

  getBuffets(): Promise<Buffet[]> {
    return firstValueFrom(
      this.httpClient.get<Buffet[]>(`${this.baseUrl}/api/buffets`)
    );
  }

  addBuffet(buffet: SaveBuffetRequest): Promise<Buffet> {
    return firstValueFrom(
      this.httpClient.post<Buffet>(`${this.baseUrl}/api/buffets`, buffet)
    );
  }

  updateBuffet(id: number, buffet: SaveBuffetRequest): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/buffets/${id}`, buffet)
    );
  }

  deleteBuffet(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/buffets/${id}`)
    );
  }

  updateMenu(buffetId: number, productIds: number[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(
        `${this.baseUrl}/api/buffets/${buffetId}/menu`,
        productIds
      )
    );
  }

  addCashMovement(
    buffetId: number,
    amountCents: number
  ): Promise<CashMovement> {
    return firstValueFrom(
      this.httpClient.post<CashMovement>(
        `${this.baseUrl}/api/buffets/${buffetId}/cash-movements`,
        { amountCents }
      )
    );
  }

  deleteCashMovement(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/cash-movements/${id}`)
    );
  }

  getSales(): Promise<Sales> {
    return firstValueFrom(
      this.httpClient.get<Sales>(`${this.baseUrl}/api/sales`)
    );
  }

  getSalesStatistics(): Promise<SalesStatistics> {
    return firstValueFrom(
      this.httpClient.get<SalesStatistics>(
        `${this.baseUrl}/api/sales/statistics`
      )
    );
  }

  getSalesFile(): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(`${this.baseUrl}/api/sales/csv`, {
        responseType: 'blob',
      })
    );
  }

  deleteSales(): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/sales`)
    );
  }

  importFromLegacy(): Promise<LegacyBuffetImport> {
    return firstValueFrom(
      this.httpClient.post<LegacyBuffetImport>(
        `${this.baseUrl}/api/legacy-import/buffet`,
        null
      )
    );
  }
}
