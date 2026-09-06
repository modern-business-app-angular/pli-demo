export type DemandeStatus = 'nouveau' | 'en_cours' | 'traite';
export type DemandeType = 'mail' | 'sms' | 'formulaire' | 'guichet';
export type DemandePriorite = 'normale' | 'urgente' | 'bloquante';

export interface Demande {
  id: number;
  emetteur: string;
  emetteurNom?: string;
  destinataire: string;
  objet: string;
  corps: string;
  type: DemandeType;
  statut: DemandeStatus;
  dateReception: string; // ISO 8601
  elementId?: number;
  elementRef?: string;
  reponse?: {
    corps: string;
    date: string;
    par: string;
  };
}

export interface DemandeFilters {
  statut?: DemandeStatus;
  type?: DemandeType;
  search?: string;
}

export interface TraiterPayload {
  demandeId: number;
  nature: string;
  service: string;
  priorite: DemandePriorite;
  commentaire?: string;
}

export interface RepondrePayload {
  demandeId: number;
  corps: string;
}

export interface PullResult {
  count: number;
}
