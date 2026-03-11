import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const API_URL = 'https://localhost:8008/api';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './inscription.html',
  styleUrl: './inscription.css',
})
export class Inscription implements OnInit {
  inscriptionForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.inscriptionForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      telephone: [''],
      adresse: ['']
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.inscriptionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.inscriptionForm.value;

    // Envoyer vers l'API d'inscription
    // Le body correspond à ce que le backend attend
    this.http.post<any>(`${API_URL}/register`, {
      email: formData.email,
      password: formData.motDePasse,
      nom: formData.nom,
      prenom: formData.prenom,
      numTel: formData.telephone || null,
      adressePostale: formData.adresse || null,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '✓ Compte créé avec succès ! Redirection vers la connexion...';
        setTimeout(() => this.router.navigate(['/connexion']), 1500);
      },
      error: (erreur: any) => {
        this.isLoading = false;
        let message = 'Une erreur est survenue lors de l\'inscription.';
        if (erreur.status === 0) {
          message = 'Impossible de joindre le serveur (https://localhost:8008)';
        } else if (erreur.error?.detail) {
          message = erreur.error.detail;
        } else if (erreur.error?.message) {
          message = erreur.error.message;
        } else if (typeof erreur.error === 'string') {
          message = erreur.error;
        }
        this.errorMessage = message;
      }
    });
  }
}
