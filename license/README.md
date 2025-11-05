# DOSSIER LÉGAL - BLENDGINE

Ce dossier contient tous les documents légaux nécessaires pour le logiciel propriétaire Blendgine.

## 📋 FICHIERS INCLUS

### **EULA.md**
- **End User License Agreement** (Accord de Licence Utilisateur Final)
- Définit les conditions d'utilisation du logiciel
- Droits et restrictions pour les utilisateurs
- Garanties et limitations de responsabilité

### **PRIVACY_POLICY.md**
- **Politique de Confidentialité**
- Explique la collecte et l'utilisation des données
- Droits des utilisateurs (RGPD)
- Mesures de sécurité

### **TERMS_OF_SERVICE.md**
- **Conditions d'Utilisation**
- Règles d'utilisation du service
- Responsabilités des utilisateurs
- Conditions de paiement et abonnements

### **THIRD_PARTY_LICENSES.md**
- **Licences des Dépendances Tiers**
- Liste complète des bibliothèques utilisées
- Licences respectives (MIT, Apache 2.0, BSD, etc.)
- Conformité avec l'usage commercial

### **COPYRIGHT.md**
- **Notice de Copyright**
- Protection de la propriété intellectuelle
- Droits réservés à PxlSyl
- Ce qui est protégé vs non protégé

## 🔧 INTÉGRATION DANS L'APPLICATION

### **Dans le code Rust (Tauri)**
```rust
// Ajouter dans main.rs ou un module dédié
pub fn show_legal_documents() {
    // Afficher EULA, Privacy Policy, etc.
}
```

### **Dans l'interface React**
```typescript
// Composant pour afficher les documents légaux
const LegalDocuments = () => {
  return (
    <div>
      <h2>Documents Légaux</h2>
      <ul>
        <li><a href="/license/EULA.md">EULA</a></li>
        <li><a href="/license/PRIVACY_POLICY.md">Politique de Confidentialité</a></li>
        <li><a href="/license/TERMS_OF_SERVICE.md">Conditions d'Utilisation</a></li>
      </ul>
    </div>
  );
};
```

### **Dans le fichier tauri.conf.json**
```json
{
  "tauri": {
    "bundle": {
      "resources": [
        "license/*"
      ]
    }
  }
}
```

## 📝 PERSONNALISATION REQUISE

Avant de distribuer votre application, vous devez :

1. **Remplacer les placeholders** :
   - `[votre-email]` → Votre adresse email
   - `[votre-site]` → URL de votre site web
   - `[votre-adresse]` → Votre adresse physique

2. **Adapter le contenu** :
   - Modifier les clauses selon vos besoins spécifiques
   - Ajouter des sections pour votre modèle commercial
   - Consulter un avocat pour validation

3. **Mettre à jour les versions** :
   - Changer les numéros de version si nécessaire
   - Mettre à jour les dates

## ⚖️ CONFORMITÉ JURIDIQUE

### **Recommandations** :
- ✅ Consulter un avocat spécialisé en propriété intellectuelle
- ✅ Adapter les documents à votre juridiction (France/UE)
- ✅ Vérifier la conformité RGPD
- ✅ Inclure les documents dans l'application

### **Points d'attention** :
- 🔍 Vérifier les lois locales sur les logiciels
- 🔍 S'assurer de la validité des clauses de limitation
- 🔍 Adapter aux réglementations sectorielles

## 📞 SUPPORT

Pour toute question sur ces documents légaux :
- Consultez un avocat spécialisé
- Adaptez selon votre situation spécifique
- Mettez à jour régulièrement

---

**⚠️ AVERTISSEMENT :** Ces documents sont fournis à titre informatif. Il est fortement recommandé de les faire valider par un professionnel du droit avant utilisation commerciale. 