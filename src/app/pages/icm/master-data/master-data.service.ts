import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MasterDataType, MasterDataItem } from './master-data.types';

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(dataType: MasterDataType): Observable<any> {
    return this.http.get(`${this.base}/${dataType.apiEndpoint}/table-full`);
  }

  save(dataType: MasterDataType, item: MasterDataItem, originalItem?: MasterDataItem): Observable<any> {
    const fieldNames = this.getFieldNames(dataType.key);
    const payload: any = {};

    if (originalItem) {
      payload[fieldNames.old] = this.toApiFormat(originalItem, dataType);
    }
    payload[fieldNames.new] = this.toApiFormat(item, dataType);

    return this.http.post(`${this.base}/${dataType.apiEndpoint}/save-or-update`, payload);
  }

  delete(dataType: MasterDataType, id: number): Observable<any> {
    return this.http.delete(`${this.base}/${dataType.apiEndpoint}/delete?id=${id}`);
  }

  private getFieldNames(typeKey: string): { old: string; new: string } {
    switch (typeKey) {
      case 'categories':
        return { old: 'oldCategory', new: 'newCategory' };
      case 'groups':
        return { old: 'oldGroup', new: 'newGroup' };
      case 'regulations':
        return { old: 'oldRegulation', new: 'newRegulation' };
      default:
        return { old: 'oldItem', new: 'newItem' };
    }
  }

  private toApiFormat(item: MasterDataItem, dataType: MasterDataType): any {
    const result: any = {
      name: item.name,
      description: item.description,
    };
    if (item.id) {
      result.id = item.id;
    }
    if (dataType.hasActiveField) {
      result.isActive = item.isActive ?? item.active ?? false;
    }
    return result;
  }
}
