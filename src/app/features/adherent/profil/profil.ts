import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core';
import { AdherentService } from '../../../core/services/adherent';

@Component({
  selector: 'app-profil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profil.html',
})
export class Profil implements OnInit {
  private readonly authService = inject(Auth);
  private readonly adherentService = inject(AdherentService);
  private readonly fb = inject(FormBuilder);

  profil = this.adherentService.profil;
  emprunts = this.adherentService.emprunts;
  reservations = this.adherentService.reservations;
  chargement = this.adherentService.chargement;
  erreur = this.adherentService.erreur;
  estAdherent = this.authService.estAdherent;
  messageSauvegarde = signal<string | null>(null);
  sauvegardeEnCours = signal(false);
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
    // Pré-remplir avec les données de l'utilisateur connecté
    const utilisateur = this.authService.adherentActuel();
    if (utilisateur) {
      this.formulaire.patchValue({
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        adressePostale: utilisateur.adherent?.adressePostale ?? '',
        telephone: utilisateur.adherent?.numTel ?? ''
      });
    }

    // Charger les données adhérent uniquement si l'utilisateur est adhérent
    if (this.authService.estAdherent()) {
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
      this.adherentService.obtenirEmprunts().subscribe();
      this.adherentService.obtenirReservations().subscribe();
    }
  }

  sauvegarder(): void {
    if (this.formulaire.valid) {
      this.sauvegardeEnCours.set(true);
      this.messageSauvegarde.set(null);
      const val = this.formulaire.value;
      this.authService.mettreAJourProfil({
        nom: val.nom,
        prenom: val.prenom,
        numTel: val.telephone,
        adressePostale: val.adressePostale
      }).subscribe({
        next: () => {
          this.messageSauvegarde.set('Profil mis à jour avec succès !');
          this.sauvegardeEnCours.set(false);
        },
        error: () => {
          this.messageSauvegarde.set('Erreur lors de la sauvegarde du profil');
          this.sauvegardeEnCours.set(false);
        }
      });
    }
  }
}

