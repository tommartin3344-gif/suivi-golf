import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  MapPin,
  Calendar,
  Clock,
  Trash2,
  Pencil,
  X,
  Check,
  Flag,
  Car,
  Train,
  Plane,
  Wallet,
  Settings,
  Navigation,
  Loader2,
  Home,
} from 'lucide-react';
import GolfMap from './GolfMap';
import { geocodeAddress, routeDistanceKm } from './geo';

const STATUTS = [
  { value: 'a_faire', label: 'À faire', color: 'bg-stone-100 text-stone-600 border-stone-300' },
  { value: 'inscrit', label: 'Inscrit', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  { value: 'confirme', label: 'Confirmé', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
];

const TRANSPORTS = [
  { value: 'voiture', label: 'Voiture', icon: Car },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'avion', label: 'Avion', icon: Plane },
  { value: 'autre', label: 'Autre', icon: MapPin },
];

const STORAGE_KEY = 'tournois:2026';
const PARAMS_KEY = 'parametres:2026';

const defaultParams = {
  adresseDomicile: '',
  domicileLat: null,
  domicileLng: null,
  prixCarburant: 1.85,
  consommation: 7,
};

const emptyForm = {
  id: null,
  nom: '',
  club: '',
  ville: '',
  dateDebut: '',
  dateFin: '',
  dateLimiteInscription: '',
  statut: 'a_faire',
  notes: '',
  transportMode: 'voiture',
  coutTransport: '',
  coutPeage: '',
  coutInscription: '',
  coutLogement: '',
  lat: null,
  lng: null,
  distanceKm: null,
  dureeMin: null,
};

function formatEuros(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
}

function coutTotal(t) {
  return (
    (Number(t.coutTransport) || 0) +
    (Number(t.coutPeage) || 0) +
    (Number(t.coutInscription) || 0) +
    (Number(t.coutLogement) || 0)
  );
}

function coutVoitureAllerRetour(distanceKm, consommation, prixCarburant) {
  if (!distanceKm) return 0;
  const litres = ((distanceKm * 2) / 100) * (Number(consommation) || 0);
  return litres * (Number(prixCarburant) || 0);
}

// Estimation grossière : tarif moyen autoroute française pour une voiture (Classe 1),
// d'après la grille tarifaire officielle en vigueur au 1er juin 2026. Les tarifs réels
// dépendent de la section exacte empruntée (entrée/sortie) : pour un montant précis,
// utilise le simulateur officiel (bouton dans le formulaire) et ajuste le champ à la main.
const TARIF_PEAGE_MOYEN_PAR_KM = 0.1;

function estimationPeageAllerRetour(distanceKm) {
  if (!distanceKm) return 0;
  return distanceKm * 2 * TARIF_PEAGE_MOYEN_PAR_KM;
}

function formatDateRange(debut, fin) {
  if (!debut) return '';
  const opts = { day: 'numeric', month: 'short' };
  const d = new Date(debut + 'T00:00:00');
  if (!fin || fin === debut) {
    return d.toLocaleDateString('fr-FR', opts);
  }
  const f = new Date(fin + 'T00:00:00');
  const sameMonth = d.getMonth() === f.getMonth();
  const startStr = d.toLocaleDateString('fr-FR', sameMonth ? { day: 'numeric' } : opts);
  const endStr = f.toLocaleDateString('fr-FR', opts);
  return `${startStr} - ${endStr}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

export default function SuiviTournois() {
  const [tournois, setTournois] = useState([]);
  const [parametres, setParametres] = useState(defaultParams);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [settingsForm, setSettingsForm] = useState(defaultParams);
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTournois(JSON.parse(raw));
    } catch (e) {
      // pas encore de données enregistrées
    }
    try {
      const rawParams = localStorage.getItem(PARAMS_KEY);
      if (rawParams) {
        const p = { ...defaultParams, ...JSON.parse(rawParams) };
        setParametres(p);
        setSettingsForm(p);
      }
    } catch (e) {
      // pas encore de paramètres enregistrés
    } finally {
      setLoading(false);
    }
  }, []);

  function persist(next) {
    setTournois(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      setError("Erreur d'enregistrement. Réessaie.");
    }
  }

  function persistParams(next) {
    setParametres(next);
    try {
      localStorage.setItem(PARAMS_KEY, JSON.stringify(next));
    } catch (e) {
      setError("Erreur d'enregistrement des paramètres.");
    }
  }

  async function handleGeocodeHome() {
    if (!settingsForm.adresseDomicile.trim()) return;
    setGeoLoading(true);
    setGeoError('');
    try {
      const result = await geocodeAddress(settingsForm.adresseDomicile);
      if (!result) {
        setGeoError('Adresse introuvable. Précise la ville et le code postal.');
        return;
      }
      setSettingsForm({ ...settingsForm, domicileLat: result.lat, domicileLng: result.lng });
    } catch (e) {
      setGeoError('Erreur de géolocalisation. Réessaie.');
    } finally {
      setGeoLoading(false);
    }
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    persistParams(settingsForm);
    setShowSettings(false);
  }

  function openNewForm() {
    setForm(emptyForm);
    setGeoError('');
    setShowForm(true);
  }

  function openEditForm(t) {
    setForm({ ...emptyForm, ...t });
    setGeoError('');
    setShowForm(true);
  }

  async function handleLocaliserTournoi() {
    const query = [form.club, form.ville].filter(Boolean).join(', ');
    if (!query.trim()) {
      setGeoError('Renseigne au moins le club ou la ville.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    try {
      const result = await geocodeAddress(query);
      if (!result) {
        setGeoError('Lieu introuvable. Essaie avec plus de précision (ville, région).');
        return;
      }
      let updated = { ...form, lat: result.lat, lng: result.lng };

      if (parametres.domicileLat && parametres.domicileLng) {
        const route = await routeDistanceKm(
          { lat: parametres.domicileLat, lng: parametres.domicileLng },
          { lat: result.lat, lng: result.lng }
        );
        if (route) {
          updated.distanceKm = route.distanceKm;
          updated.dureeMin = route.dureeMin;
          if (updated.transportMode === 'voiture') {
            const suggestion = coutVoitureAllerRetour(
              route.distanceKm,
              parametres.consommation,
              parametres.prixCarburant
            );
            updated.coutTransport = Math.round(suggestion).toString();
            updated.coutPeage = Math.round(estimationPeageAllerRetour(route.distanceKm)).toString();
          }
        }
      }
      setForm(updated);
    } catch (e) {
      setGeoError('Erreur lors de la localisation. Réessaie.');
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.nom || !form.dateDebut) {
      setError('Nom et date de début requis.');
      return;
    }
    setError('');
    let next;
    if (form.id) {
      next = tournois.map((t) => (t.id === form.id ? form : t));
    } else {
      next = [...tournois, { ...form, id: Date.now().toString() }];
    }
    persist(next);
    setShowForm(false);
    setForm(emptyForm);
  }

  function handleDelete(id) {
    const next = tournois.filter((t) => t.id !== id);
    persist(next);
  }

  const { aVenir, passes, prochain, budgetTotal, budgetAVenir } = useMemo(() => {
    const sorted = [...tournois].sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
    const today = new Date().toISOString().slice(0, 10);
    const aVenir = sorted.filter((t) => (t.dateFin || t.dateDebut) >= today);
    const passes = sorted.filter((t) => (t.dateFin || t.dateDebut) < today).reverse();
    const budgetTotal = sorted.reduce((sum, t) => sum + coutTotal(t), 0);
    const budgetAVenir = aVenir.reduce((sum, t) => sum + coutTotal(t), 0);
    return { aVenir, passes, prochain: aVenir[0] || null, budgetTotal, budgetAVenir };
  }, [tournois]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d2340] flex items-center justify-center">
        <p className="text-white/60 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      {/* Header */}
      <div className="bg-[#0d2340] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#d9622b]" />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#d9622b] text-xs font-semibold tracking-wider uppercase mb-1">Saison 2026</p>
              <h1 className="text-white text-3xl font-black tracking-tight">Suivi de mes tournois</h1>
            </div>
            <button
              onClick={() => {
                setSettingsForm(parametres);
                setGeoError('');
                setShowSettings(true);
              }}
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
              title="Réglages (domicile, prix carburant)"
            >
              <Settings size={20} />
            </button>
          </div>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-white text-2xl font-bold">{tournois.length}</p>
              <p className="text-white/50 text-xs">tournois enregistrés</p>
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{aVenir.length}</p>
              <p className="text-white/50 text-xs">à venir</p>
            </div>
            {prochain && (
              <div>
                <p className="text-white text-2xl font-bold">
                  {daysUntil(prochain.dateDebut)}
                  <span className="text-sm font-normal text-white/50 ml-1">j</span>
                </p>
                <p className="text-white/50 text-xs">avant {prochain.nom}</p>
              </div>
            )}
            <div>
              <p className="text-[#d9622b] text-2xl font-bold">{formatEuros(budgetTotal)}</p>
              <p className="text-white/50 text-xs">budget saison ({formatEuros(budgetAVenir)} à venir)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#0d2340] font-bold text-lg">Planning</h2>
          <button
            onClick={openNewForm}
            className="flex items-center gap-1.5 bg-[#0d2340] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#0d2340]/90 transition"
          >
            <Plus size={16} /> Ajouter un tournoi
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {tournois.length === 0 && !showForm && (
          <div className="text-center py-16 border border-dashed border-stone-300 rounded-xl">
            <Flag className="mx-auto mb-3 text-stone-300" size={32} />
            <p className="text-stone-500 text-sm">Aucun tournoi pour l'instant.</p>
            <button onClick={openNewForm} className="mt-3 text-[#0d2340] text-sm font-medium underline">
              Ajouter ton premier tournoi
            </button>
          </div>
        )}

        {/* À venir */}
        {aVenir.length > 0 && (
          <div className="space-y-3 mb-8">
            {aVenir.map((t) => (
              <TournoiCard key={t.id} t={t} onEdit={() => openEditForm(t)} onDelete={() => handleDelete(t.id)} upcoming />
            ))}
          </div>
        )}

        {/* Passés */}
        {passes.length > 0 && (
          <div>
            <h3 className="text-stone-400 text-xs font-semibold uppercase tracking-wider mb-3">Passés</h3>
            <div className="space-y-3 opacity-70">
              {passes.map((t) => (
                <TournoiCard key={t.id} t={t} onEdit={() => openEditForm(t)} onDelete={() => handleDelete(t.id)} />
              ))}
            </div>
          </div>
        )}

        {tournois.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[#0d2340] font-bold text-lg mb-3">Carte des tournois</h2>
            {!parametres.domicileLat && (
              <p className="text-xs text-stone-400 mb-2">
                Renseigne ton adresse de domicile dans les réglages (icône ⚙️ en haut) pour voir le point de départ
                et calculer les distances.
              </p>
            )}
            <GolfMap
              home={
                parametres.domicileLat
                  ? { lat: parametres.domicileLat, lng: parametres.domicileLng }
                  : null
              }
              tournois={tournois}
            />
          </div>
        )}
      </div>

      {/* Réglages */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setShowSettings(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveSettings}
            className="bg-white rounded-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0d2340] text-lg flex items-center gap-1.5">
                <Home size={17} /> Mes réglages
              </h3>
              <button type="button" onClick={() => setShowSettings(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Adresse de domicile</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                    value={settingsForm.adresseDomicile}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, adresseDomicile: e.target.value, domicileLat: null, domicileLng: null })
                    }
                    placeholder="17 rue des Golfeurs, 17000 La Rochelle"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeHome}
                    disabled={geoLoading}
                    className="shrink-0 bg-[#0d2340] text-white text-xs font-medium px-3 rounded-lg hover:bg-[#0d2340]/90 disabled:opacity-50 flex items-center gap-1"
                  >
                    {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                    Localiser
                  </button>
                </div>
                {settingsForm.domicileLat && (
                  <p className="text-xs text-emerald-600 mt-1">✓ Adresse localisée</p>
                )}
                {geoError && <p className="text-xs text-red-600 mt-1">{geoError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Prix du carburant (€/L)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                    value={settingsForm.prixCarburant}
                    onChange={(e) => setSettingsForm({ ...settingsForm, prixCarburant: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Consommation (L/100km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                    value={settingsForm.consommation}
                    onChange={(e) => setSettingsForm({ ...settingsForm, consommation: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-stone-400">
                Ces infos servent à calculer automatiquement le coût du trajet aller-retour en voiture pour chaque
                tournoi (pense à mettre à jour le prix du carburant de temps en temps).
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 border border-stone-300 text-stone-600 text-sm font-medium py-2 rounded-lg hover:bg-stone-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0d2340] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#0d2340]/90 flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0d2340] text-lg">{form.id ? 'Modifier le tournoi' : 'Nouveau tournoi'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Nom du tournoi *</label>
                <input
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Grand prix de Casteljaloux"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Club / parcours</label>
                  <input
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                    value={form.club}
                    onChange={(e) => setForm({ ...form, club: e.target.value, lat: null, lng: null })}
                    placeholder="Golf Club de..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Ville</label>
                  <input
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                    value={form.ville}
                    onChange={(e) => setForm({ ...form, ville: e.target.value, lat: null, lng: null })}
                    placeholder="Casteljaloux"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleLocaliserTournoi}
                  disabled={geoLoading}
                  className="w-full flex items-center justify-center gap-1.5 border border-stone-300 text-[#0d2340] text-xs font-medium py-2 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                >
                  {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  Localiser et calculer la distance depuis mon domicile
                </button>
                {geoError && <p className="text-xs text-red-600 mt-1">{geoError}</p>}
                {form.distanceKm != null && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ {Math.round(form.distanceKm)} km depuis chez toi (~
                    {Math.round(form.dureeMin / 60)} h de route), soit {Math.round(form.distanceKm * 2)} km
                    aller-retour
                  </p>
                )}
                {!parametres.domicileLat && (
                  <p className="text-xs text-stone-400 mt-1">
                    Astuce : renseigne ton adresse dans les réglages pour calculer la distance automatiquement.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Date de début *</label>
                  <input
                    type="date"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                    value={form.dateDebut}
                    onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Date de fin</label>
                  <input
                    type="date"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                    value={form.dateFin}
                    onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Date limite d'inscription</label>
                <input
                  type="date"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                  value={form.dateLimiteInscription}
                  onChange={(e) => setForm({ ...form, dateLimiteInscription: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Statut d'inscription</label>
                <div className="flex gap-2">
                  {STATUTS.map((s) => (
                    <button
                      type="button"
                      key={s.value}
                      onClick={() => setForm({ ...form, statut: s.value })}
                      className={`flex-1 text-xs font-medium px-2 py-1.5 rounded-lg border transition ${
                        form.statut === s.value ? s.color : 'bg-white text-stone-400 border-stone-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 pt-3 mt-1">
                <p className="text-xs font-semibold text-[#0d2340] mb-2 flex items-center gap-1">
                  <Wallet size={13} /> Budget prévisionnel
                </p>

                <label className="text-xs font-medium text-stone-500 mb-1 block">Moyen de transport</label>
                <div className="flex gap-2 mb-3">
                  {TRANSPORTS.map((tr) => {
                    const Icon = tr.icon;
                    return (
                      <button
                        type="button"
                        key={tr.value}
                        onClick={() => {
                          const next = { ...form, transportMode: tr.value };
                          if (tr.value === 'voiture' && form.distanceKm != null) {
                            const suggestion = coutVoitureAllerRetour(
                              form.distanceKm,
                              parametres.consommation,
                              parametres.prixCarburant
                            );
                            next.coutTransport = Math.round(suggestion).toString();
                            next.coutPeage = Math.round(estimationPeageAllerRetour(form.distanceKm)).toString();
                          }
                          setForm(next);
                        }}
                        className={`flex-1 flex flex-col items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg border transition ${
                          form.transportMode === tr.value
                            ? 'bg-[#0d2340] text-white border-[#0d2340]'
                            : 'bg-white text-stone-400 border-stone-200'
                        }`}
                      >
                        <Icon size={14} /> {tr.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Transport (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                      value={form.coutTransport}
                      onChange={(e) => setForm({ ...form, coutTransport: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Péages (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                      value={form.coutPeage}
                      onChange={(e) => setForm({ ...form, coutPeage: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Inscription (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                      value={form.coutInscription}
                      onChange={(e) => setForm({ ...form, coutInscription: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Logement (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
                      value={form.coutLogement}
                      onChange={(e) => setForm({ ...form, coutLogement: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                {form.transportMode === 'voiture' && Number(form.coutPeage) > 0 && (
                  <p className="text-xs text-stone-400 mt-1">
                    Péages estimés sur une base moyenne (~{TARIF_PEAGE_MOYEN_PAR_KM}€/km) — pour le tarif exact de
                    ton trajet,{' '}
                    <a
                      href="https://www.autoroutes.fr/fr/calcul-itineraire.htm"
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-[#0d2340] font-medium"
                    >
                      utilise le simulateur officiel
                    </a>{' '}
                    puis ajuste le montant ci-dessus.
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-1.5 text-right">
                  Total : <span className="font-semibold text-[#0d2340]">{formatEuros(coutTotal(form))}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Notes</label>
                <textarea
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340] resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Hébergement, trajet, contacts..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-stone-300 text-stone-600 text-sm font-medium py-2 rounded-lg hover:bg-stone-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0d2340] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#0d2340]/90 flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function TournoiCard({ t, onEdit, onDelete, upcoming }) {
  const statutInfo = STATUTS.find((s) => s.value === t.statut) || STATUTS[0];
  const jours = daysUntil(t.dateDebut);
  const total = coutTotal(t);
  const transportInfo = TRANSPORTS.find((tr) => tr.value === t.transportMode);
  const TransportIcon = transportInfo ? transportInfo.icon : Car;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-stone-300 transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <h3 className="font-bold text-[#0d2340] text-sm truncate">{t.nom}</h3>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statutInfo.color}`}>
            {statutInfo.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {formatDateRange(t.dateDebut, t.dateFin)}
            {upcoming && jours >= 0 && <span className="text-[#d9622b] font-medium ml-1">J-{jours}</span>}
          </span>
          {(t.club || t.ville) && (
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {[t.club, t.ville].filter(Boolean).join(', ')}
            </span>
          )}
          {t.dateLimiteInscription && (
            <span className="flex items-center gap-1">
              <Clock size={13} /> Inscription avant le{' '}
              {new Date(t.dateLimiteInscription + 'T00:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#0d2340]">
            <TransportIcon size={13} />
            <span className="font-semibold">{formatEuros(total)}</span>
            <span className="text-stone-400">
              (transport {formatEuros(t.coutTransport)} · péages {formatEuros(t.coutPeage)} · inscription{' '}
              {formatEuros(t.coutInscription)} · logement {formatEuros(t.coutLogement)})
            </span>
          </div>
        )}
        {t.notes && <p className="text-xs text-stone-400 mt-1.5">{t.notes}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 text-stone-400 hover:text-[#0d2340] hover:bg-stone-50 rounded-lg">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
