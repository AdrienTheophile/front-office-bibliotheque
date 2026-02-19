import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { params });
  }

  put<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body);
  }

  post<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body);
  }

  patch<T>(path: string, body: Object = {}): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`);
  }
}
