# LEGAL FOLDER - BLENDGINE

This folder contains all the necessary legal documents for the proprietary Blendgine software.

## 📋 INCLUDED FILES

### **EULA_EN.md**
- **End User License Agreement**
- Defines the terms of use for the software
- User rights and restrictions
- Warranties and liability limitations

### **PRIVACY_POLICY_EN.md**
- **Privacy Policy**
- Explains data collection and usage
- User rights (GDPR)
- Security measures

### **TERMS_OF_SERVICE_EN.md**
- **Terms of Service**
- Rules for using the service
- User responsibilities
- Payment and subscription terms

### **THIRD_PARTY_LICENSES_EN.md**
- **Third-Party Licenses**
- Complete list of libraries used
- Respective licenses (MIT, Apache 2.0, BSD, etc.)
- Compliance with commercial use

### **COPYRIGHT_EN.md**
- **Copyright Notice**
- Intellectual property protection
- Rights reserved to PxlSyl
- What is protected vs not protected

## 🔧 INTEGRATION IN THE APPLICATION

### **In Rust (Tauri) code**
```rust
// Add in main.rs or a dedicated module
pub fn show_legal_documents() {
    // Display EULA, Privacy Policy, etc.
}
```

### **In the React interface**
```typescript
// Component to display legal documents
const LegalDocuments = () => {
  return (
    <div>
      <h2>Legal Documents</h2>
      <ul>
        <li><a href="/license/EULA_EN.md">EULA</a></li>
        <li><a href="/license/PRIVACY_POLICY_EN.md">Privacy Policy</a></li>
        <li><a href="/license/TERMS_OF_SERVICE_EN.md">Terms of Service</a></li>
      </ul>
    </div>
  );
};
```

### **In tauri.conf.json**
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

## 📝 REQUIRED CUSTOMIZATION

Before distributing your application, you must:

1. **Replace placeholders:**
   - `[your-email]` → Your email address
   - `[your-website]` → Your website URL
   - `[your-address]` → Your physical address

2. **Adapt the content:**
   - Modify clauses for your specific needs
   - Add sections for your business model
   - Consult a lawyer for validation

3. **Update versions:**
   - Change version numbers if needed
   - Update dates

## ⚖️ LEGAL COMPLIANCE

### **Recommendations:**
- ✅ Consult an intellectual property lawyer
- ✅ Adapt documents to your jurisdiction (France/EU)
- ✅ Check GDPR compliance
- ✅ Include documents in the application

### **Points of attention:**
- 🔍 Check local software laws
- 🔍 Ensure validity of limitation clauses
- 🔍 Adapt to sector regulations

## 📞 SUPPORT

For any questions about these legal documents:
- Consult a specialized lawyer
- Adapt according to your specific situation
- Update regularly

---

**⚠️ DISCLAIMER:** These documents are provided for informational purposes only. It is strongly recommended to have them validated by a legal professional before commercial use. 