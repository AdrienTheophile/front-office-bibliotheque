import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdherentService } from '../../../core/services/adherent';

@Component({
  selector: 'app-profil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profil.html',
})
export class Profil implements OnInit {
  private readonly adherentService = inject(AdherentService);
  private readonly fb = inject(FormBuilder);

  profil = this.adherentService.profil;
  emprunts = this.adherentService.emprunts;
  reservations = this.adherentService.reservations;
  chargement = this.adherentService.chargement;
  erreur = this.adherentService.erreur;
  formulaire: FormGroup;

  constructor() {
    this.formulaire = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dateNaissance: [''],
      adressePostale: [''],
      telephone: ['']
    });
  }

  ngOnInit(): void {
    // Charger le profil au démarrage
    this.adherentService.obtenirProfil().subscribe({
      next: (profil) => {
        this.formulaire.patchValue({
          nom: profil.utilisateur.nom,
          prenom: profil.utilisateur.prenom,
          email: profil.utilisateur.email,
          dateNaissance: profil.dateNaissance,
          adressePostale: profil.adressePostale,
          telephone: profil.telephone
        });
      }
    });

    // Charger les emprunts et réservations
    this.adherentService.obtenirEmprunts().subscribe();
    this.adherentService.obtenirReservations().subscribe();
  }

  sauvegarder(): void {
    if (this.formulaire.valid) {
      console.log('Profil sauvegardé:', this.formulaire.value);
      // TODO: Appeler API pour sauvegarder les modifications
    }
  }
}

