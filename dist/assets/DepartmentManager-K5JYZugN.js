import{c as W,r as c,j as e,X as re,D as p,M as $e,f as le,b as Ie,g as oe,a as Re}from"./index-oUFVPpyJ.js";import{g as ae,U as Pe}from"./qrCodeUtils-DospTv9v.js";import{C as Ae}from"./chevron-right-lxuvvKuY.js";import{D as ce}from"./download-CIIf_GVf.js";import{a as T,S as Qe}from"./square-pen-DXp1HkK8.js";import{M as Me,P as Le}from"./phone-Ddd4DcXX.js";import{C as ze}from"./calendar-BoRW1yZE.js";import{B as Te}from"./building-UZaLRowK.js";import{P as Fe}from"./package-DMpabAYM.js";import{W as Oe}from"./wrench-DvUxNb4T.js";import{S as Z}from"./supabaseDataService-B5BkBcB1.js";import{A as me}from"./alert-circle-BS5oX9Er.js";import{E as X}from"./eye-CBaXM4o-.js";import{S as Ue}from"./save-B6UljF_n.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=W("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=W("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=W("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=W("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=W("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]),C=[];for(let t=0;t<256;++t)C.push((t+256).toString(16).slice(1));function He(t,a=0){return(C[t[a+0]]+C[t[a+1]]+C[t[a+2]]+C[t[a+3]]+"-"+C[t[a+4]]+C[t[a+5]]+"-"+C[t[a+6]]+C[t[a+7]]+"-"+C[t[a+8]]+C[t[a+9]]+"-"+C[t[a+10]]+C[t[a+11]]+C[t[a+12]]+C[t[a+13]]+C[t[a+14]]+C[t[a+15]]).toLowerCase()}let se;const Ye=new Uint8Array(16);function Be(){if(!se){if(typeof crypto>"u"||!crypto.getRandomValues)throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");se=crypto.getRandomValues.bind(crypto)}return se(Ye)}const Ge=typeof crypto<"u"&&crypto.randomUUID&&crypto.randomUUID.bind(crypto),de={randomUUID:Ge};function Je(t,a,n){var i;if(de.randomUUID&&!t)return de.randomUUID();t=t||{};const r=t.random??((i=t.rng)==null?void 0:i.call(t))??Be();if(r.length<16)throw new Error("Random bytes length must be >= 16");return r[6]=r[6]&15|64,r[8]=r[8]&63|128,He(r)}const xe=(t,a,n="employee")=>{const r=window.open("","_blank");if(!r){alert("Please allow popups to print ID cards");return}const i=n==="employee",f=i?"85.60mm":"210mm",u=i?"53.98mm":"297mm",h=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${i?"Employee ID Card":"QR Label"} - ${t.name}</title>
      <style>
        @page {
          size: ${f} ${u};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${f};
          height: ${u};
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: ${i?"white":"black"};
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        ${i?`
        .card-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .header {
          background: rgba(255, 255, 255, 0.15);
          padding: 2mm;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .company-logo {
          font-size: 8px;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .main-content {
          flex: 1;
          display: flex;
          padding: 2mm;
          gap: 2mm;
        }
        
        .photo-section {
          flex: 0 0 18mm;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .employee-photo {
          width: 16mm;
          height: 20mm;
          background: white;
          border-radius: 1mm;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .employee-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-photo {
          color: #666;
          font-size: 6px;
          text-align: center;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-left: 1mm;
        }
        
        .employee-details {
          font-size: 6px;
          line-height: 1.4;
        }
        
        .detail-row {
          margin: 0.5mm 0;
          display: flex;
        }
        
        .detail-label {
          font-weight: bold;
          width: 12mm;
          opacity: 0.9;
        }
        
        .detail-value {
          font-weight: normal;
          flex: 1;
        }
        
        .employee-name {
          font-size: 7px;
          font-weight: bold;
          margin-bottom: 1mm;
          text-transform: uppercase;
        }
        
        .qr-section {
          position: absolute;
          bottom: 2mm;
          right: 2mm;
          width: 15mm;
          height: 15mm;
        }
        
        .qr-code {
          width: 100%;
          height: 100%;
          background: white;
          padding: 0.5mm;
          border-radius: 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        `:`
        .label-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20mm;
          text-align: center;
        }
        
        .label-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10mm;
          color: #1e3a8a;
        }
        
        .label-qr {
          width: 80mm;
          height: 80mm;
          margin: 10mm 0;
          border: 2px solid #1e3a8a;
          padding: 5mm;
        }
        
        .label-qr img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .label-info {
          font-size: 14px;
          margin-top: 10mm;
        }
        
        .label-id {
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
          margin: 5mm 0;
          color: #1e3a8a;
        }
        `}
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${i?`
      <div class="card-container">
        <div class="header">
          <div class="company-logo">QR Timecard System</div>
        </div>
        
        <div class="main-content">
          <div class="photo-section">
            <div class="employee-photo">
              ${t.photo?`<img src="${t.photo}" alt="Employee Photo" />`:'<div class="no-photo">No Photo</div>'}
            </div>
          </div>
          
          <div class="info-section">
            <div class="employee-name">${t.name}</div>
            <div class="employee-details">
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${t.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dept:</span>
                <span class="detail-value">${t.department||"N/A"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${t.position||"N/A"}</span>
              </div>
              ${t.bloodGroup?`
              <div class="detail-row">
                <span class="detail-label">Blood:</span>
                <span class="detail-value">${t.bloodGroup}</span>
              </div>
              `:""}
            </div>
          </div>
        </div>
        
        <div class="qr-section">
          <div class="qr-code">
            <img src="${a}" alt="QR Code" />
          </div>
        </div>
      </div>
      `:`
      <div class="label-container">
        <div class="label-title">${t.name}</div>
        <div class="label-qr">
          <img src="${a}" alt="QR Code" />
        </div>
        <div class="label-id">${t.id}</div>
        <div class="label-info">
          ${n.charAt(0).toUpperCase()+n.slice(1)} QR Code<br>
          Scan for ${n} operations
        </div>
      </div>
      `}
    </body>
    </html>
  `;r.document.write(h),r.document.close();const x=()=>{setTimeout(()=>{r.print(),setTimeout(()=>{r.close()},1e3)},1e3)};r.document.readyState==="complete"?x():r.onload=x},pe=(t,a)=>{const n=window.open("","_blank");if(!n){alert("Please allow popups to generate employee ID card");return}const r="85.60mm",i="53.98mm";`${t.name}${r}${i}${r}${i}`,t.photo&&`${t.photo}`,`${t.name}${t.position}${t.id}${t.department}${t.bloodGroup||"N/A"}${t.email||"Not provided"}${t.phone||"Not provided"}${a}`;const f=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee ID Card - ${t.name}</title>
      <style>
        @page {
          size: ${r} ${i};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${r};
          height: ${i};
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          color: #1f2937;
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          overflow: hidden;
        }
        
        .card-container {
          width: 100%;
          height: 100%;
          background: white;
          margin: 2mm;
          width: calc(100% - 4mm);
          height: calc(100% - 4mm);
          border-radius: 3mm;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .header-section {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          height: 12mm;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          color: white;
          border-radius: 3mm 3mm 0 0;
        }
        
        .company-logo {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .logo-icon {
          width: 6mm;
          height: 6mm;
          background: white;
          border-radius: 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e40af;
          font-weight: bold;
          font-size: 8px;
        }
        
        .company-text {
          font-size: 7px;
          font-weight: bold;
          line-height: 1.2;
        }
        
        .tagline {
          font-size: 5px;
          opacity: 0.9;
        }
        
        .geometric-pattern {
          position: absolute;
          right: 0;
          top: 0;
          width: 15mm;
          height: 12mm;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%);
          clip-path: polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        
        .main-content {
          padding: 2mm 3mm;
          display: flex;
          gap: 2mm;
          height: calc(100% - 20mm);
        }
        
        .photo-section {
          flex: 0 0 18mm;
        }
        
        .employee-photo {
          width: 18mm;
          height: 22mm;
          background: #f3f4f6;
          border-radius: 2mm;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .employee-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-photo {
          color: #9ca3af;
          font-size: 6px;
          text-align: center;
          line-height: 1.2;
        }
        
        .photo-frame {
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          border: 2px solid #3b82f6;
          border-radius: 2mm;
          pointer-events: none;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .employee-name {
          font-size: 9px;
          font-weight: bold;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1mm;
          line-height: 1.1;
        }
        
        .employee-title {
          font-size: 6px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          margin-bottom: 2mm;
        }
        
        .employee-details {
          font-size: 5.5px;
          line-height: 1.4;
          color: #374151;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 0.8mm;
        }
        
        .detail-label {
          font-weight: bold;
          width: 8mm;
          color: #1f2937;
        }
        
        .detail-value {
          flex: 1;
          color: #4b5563;
        }
        
        .id-number {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #1e40af;
        }
        
        .footer-section {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8mm;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          border-radius: 0 0 3mm 3mm;
        }
        
        .qr-section {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .qr-code {
          width: 6mm;
          height: 6mm;
          background: white;
          padding: 0.3mm;
          border-radius: 0.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .website {
          color: white;
          font-size: 5px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        
        .decorative-elements {
          position: absolute;
          top: 15mm;
          right: 1mm;
          width: 8mm;
          height: 15mm;
          opacity: 0.1;
        }
        
        .diamond {
          width: 3mm;
          height: 3mm;
          background: #3b82f6;
          transform: rotate(45deg);
          margin: 1mm;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="card-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="company-logo">
            <div class="logo-icon">QR</div>
            <div>
              <div class="company-text">QR TIMECARD SYSTEM</div>
              <div class="tagline">EMPLOYEE IDENTIFICATION</div>
            </div>
          </div>
          <div class="geometric-pattern"></div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
          <!-- Photo Section -->
          <div class="photo-section">
            <div class="employee-photo">
              ${t.photo?`<img src="${t.photo}" alt="Employee Photo" />`:'<div class="no-photo">EMPLOYEE<br>PHOTO</div>'}
              <div class="photo-frame"></div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="info-section">
            <div>
              <div class="employee-name">${t.name}</div>
              <div class="employee-title">${t.position}</div>
              
              <div class="employee-details">
                <div class="detail-row">
                  <span class="detail-label">ID No</span>
                  <span class="detail-value id-number">${t.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood</span>
                  <span class="detail-value">${t.bloodGroup||"N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${t.email||"Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${t.phone||"Not provided"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Decorative Elements -->
        <div class="decorative-elements">
          <div class="diamond"></div>
          <div class="diamond"></div>
          <div class="diamond"></div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer-section">
          <div class="qr-section">
            <div class="qr-code">
              <img src="${a}" alt="QR Code" />
            </div>
          </div>
          <div class="website">WWW.QRTIMECARD.COM</div>
        </div>
      </div>
    </body>
    </html>
  `;n.document.write(f),n.document.close();const u=()=>{setTimeout(()=>{n.print(),setTimeout(()=>{n.close()},1e3)},1e3)};n.document.readyState==="complete"?u():n.onload=u},Ze=(t,a)=>{const n=window.open("","_blank");if(!n){alert("Please allow popups to download employee ID card");return}const r="85.60mm",i="53.98mm",f=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee ID Card - ${t.name}</title>
      <style>
        @page {
          size: ${r} ${i};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${r};
          height: ${i};
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          color: #1f2937;
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          overflow: hidden;
        }
        
        .card-container {
          width: 100%;
          height: 100%;
          background: white;
          margin: 2mm;
          width: calc(100% - 4mm);
          height: calc(100% - 4mm);
          border-radius: 3mm;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .header-section {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          height: 12mm;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          color: white;
          border-radius: 3mm 3mm 0 0;
        }
        
        .company-logo {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .logo-icon {
          width: 6mm;
          height: 6mm;
          background: white;
          border-radius: 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e40af;
          font-weight: bold;
          font-size: 8px;
        }
        
        .company-text {
          font-size: 7px;
          font-weight: bold;
          line-height: 1.2;
        }
        
        .tagline {
          font-size: 5px;
          opacity: 0.9;
        }
        
        .geometric-pattern {
          position: absolute;
          right: 0;
          top: 0;
          width: 15mm;
          height: 12mm;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%);
          clip-path: polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        
        .main-content {
          padding: 2mm 3mm;
          display: flex;
          gap: 2mm;
          height: calc(100% - 20mm);
        }
        
        .photo-section {
          flex: 0 0 18mm;
        }
        
        .employee-photo {
          width: 18mm;
          height: 22mm;
          background: #f3f4f6;
          border-radius: 2mm;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .employee-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-photo {
          color: #9ca3af;
          font-size: 6px;
          text-align: center;
          line-height: 1.2;
        }
        
        .photo-frame {
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          border: 2px solid #3b82f6;
          border-radius: 2mm;
          pointer-events: none;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .employee-name {
          font-size: 9px;
          font-weight: bold;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1mm;
          line-height: 1.1;
        }
        
        .employee-title {
          font-size: 6px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          margin-bottom: 2mm;
        }
        
        .employee-details {
          font-size: 5.5px;
          line-height: 1.4;
          color: #374151;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 0.8mm;
        }
        
        .detail-label {
          font-weight: bold;
          width: 8mm;
          color: #1f2937;
        }
        
        .detail-value {
          flex: 1;
          color: #4b5563;
        }
        
        .id-number {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #1e40af;
        }
        
        .footer-section {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8mm;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          border-radius: 0 0 3mm 3mm;
        }
        
        .qr-section {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .qr-code {
          width: 6mm;
          height: 6mm;
          background: white;
          padding: 0.3mm;
          border-radius: 0.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .website {
          color: white;
          font-size: 5px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        
        .decorative-elements {
          position: absolute;
          top: 15mm;
          right: 1mm;
          width: 8mm;
          height: 15mm;
          opacity: 0.1;
        }
        
        .diamond {
          width: 3mm;
          height: 3mm;
          background: #3b82f6;
          transform: rotate(45deg);
          margin: 1mm;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="card-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="company-logo">
            <div class="logo-icon">QR</div>
            <div>
              <div class="company-text">QR TIMECARD SYSTEM</div>
              <div class="tagline">EMPLOYEE IDENTIFICATION</div>
            </div>
          </div>
          <div class="geometric-pattern"></div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
          <!-- Photo Section -->
          <div class="photo-section">
            <div class="employee-photo">
              ${t.photo?`<img src="${t.photo}" alt="Employee Photo" />`:'<div class="no-photo">EMPLOYEE<br>PHOTO</div>'}
              <div class="photo-frame"></div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="info-section">
            <div>
              <div class="employee-name">${t.name}</div>
              <div class="employee-title">${t.position}</div>
              
              <div class="employee-details">
                <div class="detail-row">
                  <span class="detail-label">ID No</span>
                  <span class="detail-value id-number">${t.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Dept</span>
                  <span class="detail-value">${t.department}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood</span>
                  <span class="detail-value">${t.bloodGroup||"N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${t.email||"Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${t.phone||"Not provided"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Decorative Elements -->
        <div class="decorative-elements">
          <div class="diamond"></div>
          <div class="diamond"></div>
          <div class="diamond"></div>
        </div>
        
        <!-- Footer Section with QR Code -->
        <div class="footer-section">
          <div class="qr-section">
            <div class="qr-code">
              <img src="${a}" alt="QR Code" />
            </div>
          </div>
          <div class="website">WWW.QRTIMECARD.COM</div>
        </div>
      </div>
    </body>
    </html>
  `;n.document.write(f),n.document.close();const u=()=>{setTimeout(()=>{n.print(),setTimeout(()=>{n.close()},1e3)},1e3)};n.document.readyState==="complete"?u():n.onload=u},Xe=({entity:t,entityType:a,onClose:n,showMultiple:r=!1,entities:i=[]})=>{const[f,u]=c.useState(""),[h,x]=c.useState(!0),[v,S]=c.useState(0),[y,o]=c.useState(t),[A,l]=c.useState([]),$=r?i:[t];c.useEffect(()=>{j(y)},[y]),c.useEffect(()=>{r&&i.length>0?o(i[v]):o(t)},[v,t,i,r]),c.useEffect(()=>{r&&i&&i.length>0&&(async()=>{const q=[];for(const E of i)try{const Q=E.qrCode||E.id,O=await ae(Q);q.push(O)}catch(Q){console.error("Error generating QR code:",Q),q.push("")}l(q)})()},[r,i]);const j=async m=>{x(!0);try{let q;a==="equipment"&&m.custom_equipment_id?q=m.custom_equipment_id:q=m.qrCode||m.id;const E=await ae(q);u(E)}catch(q){console.error("Error generating QR code:",q)}finally{x(!1)}},I=()=>{if(!r||i.length===0)return;const m=window.open("","_blank");if(!m){alert("Please allow popups to print QR codes");return}const q=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk QR Codes</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .qr-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .qr-item {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .qr-image {
            width: 150px;
            height: 150px;
            margin: 0 auto;
          }
          .qr-name {
            font-weight: bold;
            margin-top: 10px;
          }
          .qr-id {
            font-family: monospace;
            margin-top: 5px;
            color: #666;
          }
          @media print {
            .qr-grid {
              page-break-inside: avoid;
            }
            .qr-item {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <h1>Bulk QR Codes - ${D(a)}s</h1>
        <div class="qr-grid">
          ${i.map((E,Q)=>`
            <div class="qr-item">
              <img class="qr-image" src="${A[Q]||""}" alt="QR Code">
              <div class="qr-name">${E.name}</div>
              <div class="qr-id">${E.id}</div>
            </div>
          `).join("")}
        </div>
      </body>
      </html>
    `;m.document.write(q),m.document.close(),m.onload=()=>{setTimeout(()=>{m.print()},1e3)}},w=()=>{a==="employee"?pe(y,f):xe(y,f,a)},R=()=>{if(a==="employee")Ze(y,f);else{const m=document.createElement("a");m.href=f,m.download=`${a}-${y.id}-qrcode.png`,document.body.appendChild(m),m.click(),document.body.removeChild(m)}},d=()=>{v<$.length-1&&S(v+1)},N=()=>{v>0&&S(v-1)},D=m=>{switch(m){case"employee":return"Employee";case"equipment":return"Equipment";case"material":return"Material";case"site":return"Site";default:return"Item"}};return e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",children:e.jsxs("div",{className:"bg-white rounded-xl shadow-2xl w-full max-w-md p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:[D(a)," QR Code",r?"s":"",r&&` (${v+1}/${$.length})`]}),e.jsx("button",{onClick:n,className:"text-gray-400 hover:text-gray-600 transition-colors",children:e.jsx(re,{className:"w-5 h-5"})})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("h4",{className:"font-medium text-gray-900 text-lg",children:y.name}),e.jsx("p",{className:"text-gray-600",children:a==="employee"?y.position:a==="equipment"?y.model:a==="material"?`${y.quantity} ${y.unit}`:y.province}),e.jsxs("p",{className:"text-sm text-gray-500 mt-1",children:["ID: ",y.id]})]}),e.jsx("div",{className:"flex justify-center",children:h?e.jsx("div",{className:"w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"})}):e.jsx("div",{className:"p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm",children:e.jsx("img",{src:f,alt:`QR Code for ${y.name}`,className:"w-64 h-64"})})}),r&&$.length>1&&e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("button",{onClick:N,disabled:v===0,className:"p-2 bg-gray-100 rounded-full disabled:opacity-50",children:e.jsx(We,{className:"w-5 h-5"})}),e.jsxs("span",{className:"text-sm text-gray-600",children:[v+1," of ",$.length]}),e.jsx("button",{onClick:d,disabled:v===$.length-1,className:"p-2 bg-gray-100 rounded-full disabled:opacity-50",children:e.jsx(Ae,{className:"w-5 h-5"})})]}),r&&$.length>1&&e.jsx("div",{className:"mt-4 pt-4 border-t border-gray-200",children:e.jsxs("button",{onClick:I,className:"w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors",children:[e.jsx(P,{className:"w-4 h-4"}),e.jsxs("span",{children:["Print All QR Codes (",$.length,")"]})]})}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsxs("button",{onClick:w,className:"flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(P,{className:"w-4 h-4"}),e.jsx("span",{children:a==="employee"?"Print ID Card":"Print QR Label"})]}),e.jsxs("button",{onClick:R,className:"flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors",children:[e.jsx(ce,{className:"w-4 h-4"}),e.jsx("span",{children:"Download"})]})]})]})]})})},Ke=({entity:t,entityType:a,onClose:n,onEdit:r})=>{const[i,f]=c.useState(""),[u,h]=c.useState(!0),[x,v]=c.useState([]);c.useEffect(()=>{y(),S()},[t]);const S=()=>{v(p.loadSites())},y=async()=>{h(!0);try{const w=t.qrCode||t.id,R=await ae(w);f(R)}catch(w){console.error("Error generating QR code:",w)}finally{h(!1)}},o=()=>{a==="employee"?pe(t,i):xe(t,i,a)},A=()=>{const w=document.createElement("a");w.href=i,w.download=`${a}-${t.id}-qrcode.png`,document.body.appendChild(w),w.click(),document.body.removeChild(w)},l=w=>{const R=x.find(d=>d.id===w);return R?R.name:"Unknown Site"},$=w=>{switch(w){case"active":case"available":return"bg-green-100 text-green-800 border-green-200";case"inactive":case"down":return"bg-red-100 text-red-800 border-red-200";case"in-use":return"bg-blue-100 text-blue-800 border-blue-200";case"maintenance":case"low-stock":return"bg-yellow-100 text-yellow-800 border-yellow-200";case"out-of-stock":return"bg-red-100 text-red-800 border-red-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},I=(()=>{switch(a){case"employee":return le;case"equipment":return Oe;case"material":return Fe;case"site":return Te;default:return le}})();return e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",children:e.jsxs("div",{className:"bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex items-center justify-between p-6 border-b border-gray-200",children:[e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(I,{className:`w-6 h-6 ${a==="employee"?"text-blue-600":a==="equipment"?"text-green-600":a==="material"?"text-orange-600":"text-purple-600"}`}),e.jsxs("h2",{className:"text-xl font-semibold text-gray-900",children:[a.charAt(0).toUpperCase()+a.slice(1)," Profile"]})]}),e.jsx("button",{onClick:n,className:"text-gray-400 hover:text-gray-600",children:e.jsx(re,{className:"w-6 h-6"})})]}),e.jsx("div",{className:"p-6",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:[e.jsx("div",{className:"md:col-span-1",children:e.jsxs("div",{className:"bg-gray-50 rounded-lg p-6 flex flex-col items-center",children:[u?e.jsx("div",{className:"w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"})}):e.jsx("img",{src:i,alt:`QR Code for ${t.name}`,className:"w-48 h-48 border-2 border-gray-200 rounded-lg"}),e.jsxs("div",{className:"mt-4 text-center",children:[e.jsxs("p",{className:"text-sm text-gray-500",children:["ID: ",t.id]}),e.jsxs("div",{className:"flex space-x-2 mt-4",children:[e.jsxs("button",{onClick:o,className:"flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm",children:[e.jsx(P,{className:"w-3 h-3"}),e.jsx("span",{children:"Print"})]}),e.jsxs("button",{onClick:A,className:"flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm",children:[e.jsx(P,{className:"w-3 h-3"}),e.jsx("span",{children:"Download"})]})]})]})]})}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900",children:t.name}),a==="employee"&&e.jsxs("p",{className:"text-gray-600",children:[t.position," • ",t.department]}),a==="equipment"&&e.jsxs("p",{className:"text-gray-600",children:[t.type," • ",t.model]}),a==="material"&&e.jsxs("p",{className:"text-gray-600",children:[t.type," • ",t.quantity," ",t.unit]}),a==="site"&&e.jsxs("p",{className:"text-gray-600",children:[t.type||"Site"," • ",t.province]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[t.status&&e.jsx("span",{className:`px-3 py-1 rounded-full text-sm font-medium border ${$(t.status)}`,children:t.status.toUpperCase()}),e.jsxs("button",{onClick:r,className:"flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors",children:[e.jsx(T,{className:"w-4 h-4"}),e.jsx("span",{children:"Edit"})]})]})]}),e.jsxs("div",{className:"space-y-6",children:[a==="employee"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Department"}),e.jsx("p",{className:"text-gray-900",children:t.department})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Position"}),e.jsx("p",{className:"text-gray-900",children:t.position})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Site"}),e.jsx("p",{className:"text-gray-900",children:l(t.site)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Type"}),e.jsx("p",{className:"text-gray-900",children:t.type||"Not specified"})]}),t.bloodGroup&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Blood Group"}),e.jsx("p",{className:"text-gray-900",children:t.bloodGroup})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Contact Information"}),e.jsxs("div",{className:"space-y-2",children:[t.email&&e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Me,{className:"w-4 h-4 text-gray-400"}),e.jsx("span",{className:"text-gray-900",children:t.email})]}),t.phone&&e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Le,{className:"w-4 h-4 text-gray-400"}),e.jsx("span",{className:"text-gray-900",children:t.phone})]}),!t.email&&!t.phone&&e.jsx("p",{className:"text-gray-500",children:"No contact information provided"})]})]})]}),a==="equipment"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Type"}),e.jsx("p",{className:"text-gray-900",children:t.type})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Model"}),e.jsx("p",{className:"text-gray-900",children:t.model})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Site"}),e.jsx("p",{className:"text-gray-900",children:l(t.site)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Status"}),e.jsx("p",{className:"text-gray-900",children:t.status})]}),t.serialNumber&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Serial Number"}),e.jsx("p",{className:"text-gray-900",children:t.serialNumber})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Registration Information"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Created"}),e.jsx("p",{className:"text-gray-900",children:new Date(t.createdAt).toLocaleDateString()})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Last Updated"}),e.jsx("p",{className:"text-gray-900",children:new Date(t.lastUpdated).toLocaleDateString()})]})]})]})]}),a==="material"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Type"}),e.jsx("p",{className:"text-gray-900",children:t.type})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Unit"}),e.jsx("p",{className:"text-gray-900",children:t.unit})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Quantity"}),e.jsxs("p",{className:"text-gray-900",children:[t.quantity," ",t.unit]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Site"}),e.jsx("p",{className:"text-gray-900",children:l(t.site)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Status"}),e.jsx("p",{className:"text-gray-900",children:t.status})]})]}),t.use&&e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Usage Description"}),e.jsx("p",{className:"text-gray-900",children:t.use})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Registration Information"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Created"}),e.jsx("p",{className:"text-gray-900",children:new Date(t.createdAt).toLocaleDateString()})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Last Updated"}),e.jsx("p",{className:"text-gray-900",children:new Date(t.lastUpdated).toLocaleDateString()})]})]})]})]}),a==="site"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Province"}),e.jsx("p",{className:"text-gray-900",children:t.province})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Manager"}),e.jsx("p",{className:"text-gray-900",children:t.manager})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Address"}),e.jsx("p",{className:"text-gray-900",children:t.address})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Coordinates"}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx($e,{className:"w-4 h-4 text-gray-400"}),e.jsxs("p",{className:"text-gray-900",children:[t.coordinates[1].toFixed(4),", ",t.coordinates[0].toFixed(4)]})]})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Registration Information"}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Last Updated"}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(ze,{className:"w-4 h-4 text-gray-400"}),e.jsx("p",{className:"text-gray-900",children:new Date(t.lastUpdated).toLocaleDateString()})]})]})]})]})]})]})})]})})]})})},et=({type:t,onEdit:a,onDelete:n,onImport:r,onExport:i,refreshTrigger:f})=>{const[u,h]=c.useState([]),[x,v]=c.useState([]),[S,y]=c.useState(""),[o,A]=c.useState("name"),[l,$]=c.useState("asc"),[j,I]=c.useState([]),[w,R]=c.useState(!1),[d,N]=c.useState(null),[D,m]=c.useState(!1),[q,E]=c.useState([]),[Q,O]=c.useState(!1),[K,he]=c.useState(null),[_,ge]=c.useState(""),[H,ue]=c.useState(""),[Y,be]=c.useState(""),[B,fe]=c.useState(""),ie=Ie.useRef(null),F=oe.getCurrentUserSync(),k=(F==null?void 0:F.role)==="admin"||(F==null?void 0:F.role)==="developer";c.useEffect(()=>{(async()=>{await ve()})()},[t,f]),c.useEffect(()=>{ye()},[u,S,o,l,_,H,Y,B]);const ve=async()=>{let s=[];const g=oe.useSupabase();try{if(g)switch(t){case"employees":s=await Z.getEmployees();break;case"equipment":s=await Z.getEquipment();break;case"materials":s=await Z.getMaterials();break;case"sites":s=await Z.getSites();break;case"departments":s=p.loadDepartments();break}else switch(t){case"employees":s=p.loadEmployees();break;case"equipment":s=p.loadEquipment();break;case"materials":s=p.loadMaterials();break;case"sites":s=p.loadSites();break;case"departments":s=p.loadDepartments();break}}catch(M){switch(console.error(`Error loading ${t}:`,M),t){case"employees":s=p.loadEmployees();break;case"equipment":s=p.loadEquipment();break;case"materials":s=p.loadMaterials();break;case"sites":s=p.loadSites();break;case"departments":s=p.loadDepartments();break}}h(s),I([])},ye=()=>{let s=[...u];S&&(s=s.filter(g=>["name","id","type","department","position","model","province","manager"].some(L=>g[L]&&g[L].toString().toLowerCase().includes(S.toLowerCase())))),_&&(t==="employees"||t==="equipment"||t==="materials")&&(s=s.filter(g=>g.status===_)),H&&(t==="equipment"||t==="materials"||t==="sites")&&(s=s.filter(g=>g.type===H)),Y&&t==="employees"&&(s=s.filter(g=>g.department===Y)),B&&(t==="employees"||t==="equipment"||t==="materials")&&(s=s.filter(g=>g.site===B)),s.sort((g,M)=>{const L=g[o]||"",ne=M[o]||"";return l==="asc"?L.toString().localeCompare(ne.toString()):ne.toString().localeCompare(L.toString())}),v(s)},b=s=>{o===s?$(l==="asc"?"desc":"asc"):(A(s),$("asc"))},U=s=>{s.target.checked?I(x.map(g=>g.id)):I([])},V=s=>{j.includes(s)?I(j.filter(g=>g!==s)):I([...j,s])},je=()=>{E(j),m(!0)},we=()=>{q.forEach(s=>{n(s)}),m(!1),E([]),I([])},G=s=>{N(s),R(!0)},J=s=>{he(s),O(!0)},Ne=()=>{switch(t){case"employees":return["active","inactive"];case"equipment":return["available","in-use","maintenance","down"];case"materials":return["available","low-stock","out-of-stock"];default:return[]}},ke=()=>{const s=new Set;return u.forEach(g=>{g.type&&s.add(g.type)}),Array.from(s)},Ce=()=>{const s=new Set;return u.forEach(g=>{g.department&&s.add(g.department)}),Array.from(s)},Se=()=>p.loadSites().map(g=>({id:g.id,name:g.name})),ee=s=>{const M=p.loadSites().find(L=>L.id===s);return M?M.name:"Unknown Site"},te=s=>{switch(s){case"active":case"available":return"bg-green-100 text-green-800";case"inactive":case"down":return"bg-red-100 text-red-800";case"in-use":return"bg-blue-100 text-blue-800";case"maintenance":case"low-stock":return"bg-yellow-100 text-yellow-800";case"out-of-stock":return"bg-red-100 text-red-800";default:return"bg-gray-100 text-gray-800"}},De=()=>{switch(t){case"employees":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:j.length===x.length&&x.length>0,onChange:U,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("id"),children:["ID ",o==="id"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("name"),children:["Name ",o==="name"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("department"),children:["Department ",o==="department"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("position"),children:["Position ",o==="position"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("site"),children:["Site ",o==="site"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("status"),children:["Status ",o==="status"&&(l==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"equipment":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:j.length===x.length&&x.length>0,onChange:U,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("id"),children:["ID ",o==="id"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("name"),children:["Name ",o==="name"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("type"),children:["Type ",o==="type"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("model"),children:["Model ",o==="model"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("site"),children:["Site ",o==="site"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("status"),children:["Status ",o==="status"&&(l==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"materials":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:j.length===x.length&&x.length>0,onChange:U,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("id"),children:["ID ",o==="id"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("name"),children:["Name ",o==="name"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("type"),children:["Type ",o==="type"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("quantity"),children:["Quantity ",o==="quantity"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("site"),children:["Site ",o==="site"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("status"),children:["Status ",o==="status"&&(l==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"sites":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:j.length===x.length&&x.length>0,onChange:U,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("id"),children:["ID ",o==="id"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("name"),children:["Name ",o==="name"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("type"),children:["Type ",o==="type"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("province"),children:["Province ",o==="province"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("manager"),children:["Manager ",o==="manager"&&(l==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"departments":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:j.length===x.length&&x.length>0,onChange:U,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("id"),children:["ID ",o==="id"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("name"),children:["Name ",o==="name"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("description"),children:["Description ",o==="description"&&(l==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>b("createdAt"),children:["Created ",o==="createdAt"&&(l==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});default:return null}},qe=s=>{switch(t){case"employees":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:j.includes(s.id),onChange:()=>V(s.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.id}),e.jsx("td",{className:"px-4 py-3",children:e.jsxs("div",{className:"flex items-center",children:[s.photo?e.jsx("img",{src:s.photo,alt:s.name,className:"w-8 h-8 rounded-full mr-3"}):e.jsx("div",{className:"w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center",children:e.jsx("span",{className:"text-gray-500 text-xs",children:s.name.charAt(0)})}),e.jsx("div",{className:"text-sm font-medium text-gray-900",children:s.name})]})}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.department}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.position}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:ee(s.site)}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("span",{className:`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${te(s.status)}`,children:s.status})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>J(s),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(X,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(s),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(T,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(s),className:"text-green-600 hover:text-green-900",title:"ID Card",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{E([s.id]),m(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},s.id);case"equipment":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:j.includes(s.id),onChange:()=>V(s.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.type}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.model}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:ee(s.site)}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("span",{className:`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${te(s.status)}`,children:s.status})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>J(s),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(X,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(s),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(T,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(s),className:"text-green-600 hover:text-green-900",title:"QR Code",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{E([s.id]),m(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},s.id);case"materials":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:j.includes(s.id),onChange:()=>V(s.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.type}),e.jsxs("td",{className:"px-4 py-3 text-sm text-gray-500",children:[s.quantity," ",s.unit]}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:ee(s.site)}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("span",{className:`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${te(s.status)}`,children:s.status})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>J(s),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(X,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(s),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(T,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(s),className:"text-green-600 hover:text-green-900",title:"QR Code",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{E([s.id]),m(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},s.id);case"sites":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:j.includes(s.id),onChange:()=>V(s.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.type||"N/A"}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.province}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.manager}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>J(s),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(X,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(s),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(T,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(s),className:"text-green-600 hover:text-green-900",title:"QR Code",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{E([s.id]),m(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},s.id);case"departments":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:j.includes(s.id),onChange:()=>V(s.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:s.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:s.description||"N/A"}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:new Date(s.createdAt).toLocaleDateString()}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>a(s),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(T,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{E([s.id]),m(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},s.id);default:return null}},Ee=()=>e.jsxs("div",{className:"flex flex-wrap gap-3 mb-4",children:[e.jsxs("div",{className:"relative flex-grow max-w-xs",children:[e.jsx(Qe,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"}),e.jsx("input",{type:"text",placeholder:`Search ${t}...`,value:S,onChange:s=>y(s.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]}),(t==="employees"||t==="equipment"||t==="materials")&&e.jsxs("select",{value:_,onChange:s=>ge(s.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Status"}),Ne().map(s=>e.jsx("option",{value:s,children:s},s))]}),(t==="equipment"||t==="materials"||t==="sites")&&e.jsxs("select",{value:H,onChange:s=>ue(s.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Types"}),ke().map(s=>e.jsx("option",{value:s,children:s},s))]}),t==="employees"&&e.jsxs("select",{value:Y,onChange:s=>be(s.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Departments"}),Ce().map(s=>e.jsx("option",{value:s,children:s},s))]}),(t==="employees"||t==="equipment"||t==="materials")&&e.jsxs("select",{value:B,onChange:s=>fe(s.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Sites"}),Se().map(s=>e.jsx("option",{value:s.id,children:s.name},s.id))]}),e.jsxs("div",{className:"flex space-x-2 ml-auto",children:[r&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>{var s;return(s=ie.current)==null?void 0:s.click()},className:"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(Pe,{className:"w-4 h-4"}),e.jsx("span",{children:"Import"})]}),e.jsx("input",{ref:ie,type:"file",accept:".xlsx,.xls",onChange:r,className:"hidden"})]}),i&&e.jsxs("button",{onClick:i,className:"flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors",children:[e.jsx(ce,{className:"w-4 h-4"}),e.jsx("span",{children:"Export"})]})]})]});return e.jsxs("div",{className:"space-y-4",children:[Ee(),k&&j.length>0&&e.jsxs("div",{className:"bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center justify-between mb-4",children:[e.jsxs("div",{className:"text-sm text-blue-800",children:[e.jsx("span",{className:"font-medium",children:j.length})," ",t," selected"]}),e.jsxs("button",{onClick:je,className:"flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",children:[e.jsx(z,{className:"w-4 h-4"}),e.jsx("span",{children:"Delete Selected"})]})]}),e.jsx("div",{className:"bg-white rounded-lg border border-gray-200 overflow-hidden",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{children:De()}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:x.length>0?x.map(s=>qe(s)):e.jsx("tr",{children:e.jsxs("td",{colSpan:k?8:7,className:"px-4 py-8 text-center text-gray-500",children:["No ",t," found. ",S&&`Try adjusting your search for "${S}".`]})})})]})})}),w&&d&&e.jsx(Xe,{entity:d,entityType:t.slice(0,-1),onClose:()=>R(!1)}),Q&&K&&e.jsx(Ke,{entity:K,entityType:t.slice(0,-1),onClose:()=>O(!1),onEdit:()=>{O(!1),a(K)}}),D&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",children:e.jsxs("div",{className:"bg-white rounded-xl shadow-2xl w-full max-w-md p-6",children:[e.jsxs("div",{className:"flex items-center space-x-3 mb-4",children:[e.jsx(me,{className:"w-6 h-6 text-red-600"}),e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Confirm Deletion"})]}),e.jsxs("p",{className:"text-gray-600 mb-6",children:["Are you sure you want to delete ",q.length===1?"this item":`these ${q.length} items`,"? This action cannot be undone."]}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsx("button",{onClick:we,className:"flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors",children:"Delete"}),e.jsx("button",{onClick:()=>m(!1),className:"flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors",children:"Cancel"})]})]})})]})};class gt{static async migrateEquipmentData(){try{console.log("Starting equipment data migration...");const a=p.loadEquipment();if(a.length===0)return{success:!0,message:"No equipment data to migrate",migratedCount:0};if(a.some(f=>"custom_equipment_id"in f))return{success:!0,message:"Equipment data already migrated",migratedCount:0};const r=`equipment_backup_${Date.now()}`;localStorage.setItem(r,JSON.stringify(a)),console.log(`Backup created with key: ${r}`);const i=a.map(f=>{const u=f.id;return{...f,id:Je(),custom_equipment_id:u}});return p.saveEquipment(i),await this.migrateEquipmentLogs(a,i),console.log(`Successfully migrated ${i.length} equipment records`),{success:!0,message:`Successfully migrated ${i.length} equipment records`,migratedCount:i.length}}catch(a){return console.error("Equipment migration failed:",a),{success:!1,message:`Migration failed: ${a instanceof Error?a.message:"Unknown error"}`,migratedCount:0}}}static async migrateEquipmentLogs(a,n){try{const r=new Map;a.forEach((u,h)=>{r.set(u.id,n[h].id)});const i=p.loadEquipmentLogs();if(i.length>0){const u=i.map(h=>{const x=r.get(h.equipmentId);return x?{...h,equipmentId:x}:h});p.saveEquipmentLogs(u),console.log(`Updated ${u.length} equipment logs`)}const f=p.loadTimeLogs();if(f.length>0){const u=f.map(h=>{if(h.entityType==="equipment"){const x=r.get(h.entityId);if(x)return{...h,entityId:x}}return h});p.saveTimeLogs(u),console.log("Updated time logs for equipment references")}}catch(r){console.error("Failed to migrate equipment logs:",r)}}static async rollbackMigration(a){try{const n=localStorage.getItem(a);if(!n)return{success:!1,message:"Backup data not found"};const r=JSON.parse(n);return p.saveEquipment(r),localStorage.removeItem(a),{success:!0,message:`Successfully rolled back ${r.length} equipment records`}}catch(n){return{success:!1,message:`Rollback failed: ${n instanceof Error?n.message:"Unknown error"}`}}}static validateCustomEquipmentId(a){return!a||a.trim()===""?{valid:!1,error:"Custom Equipment ID is required"}:/^[A-Z0-9-]{1,10}$/.test(a)?{valid:!0}:{valid:!1,error:"Custom Equipment ID must be 1-10 characters, uppercase letters, numbers, and dashes only"}}static isCustomEquipmentIdUnique(a,n){return!p.loadEquipment().some(i=>i.custom_equipment_id===a&&i.id!==n)}}const ut=({onDepartmentUpdate:t})=>{const[a,n]=c.useState([]),[r,i]=c.useState(!1),[f,u]=c.useState("card"),[h,x]=c.useState(null),[v,S]=c.useState({name:"",description:""}),[y,o]=c.useState(null);c.useEffect(()=>{A()},[]);const A=()=>{const d=p.loadDepartments();n(d)},l=(d,N)=>{o({type:d,text:N}),setTimeout(()=>o(null),3e3)},$=(d,N)=>{const D=d.trim().toLowerCase();return!a.some(m=>m.name.toLowerCase()===D&&m.id!==N)},j=d=>{if(d.preventDefault(),!v.name.trim()){l("error","Department name is required");return}if(!$(v.name,h==null?void 0:h.id)){l("error","Department name already exists");return}if(h){const N={...h,name:v.name.trim(),description:v.description.trim(),lastUpdated:new Date().toISOString()},D=a.map(m=>m.id===h.id?N:m);n(D),p.saveDepartments(D),p.logTransaction("department","update",N),l("success","Department updated successfully")}else{const N={id:`dept-${Date.now()}`,name:v.name.trim(),description:v.description.trim(),createdAt:new Date().toISOString(),lastUpdated:new Date().toISOString()},D=[...a,N];n(D),p.saveDepartments(D),p.logTransaction("department","create",N),l("success","Department created successfully")}I(),t==null||t()},I=()=>{S({name:"",description:""}),x(null),i(!1)},w=d=>{x(d),S({name:d.name,description:d.description||""}),i(!0)},R=d=>{if(window.confirm(`Are you sure you want to delete "${d.name}"?`)){const N=a.filter(D=>D.id!==d.id);n(N),p.saveDepartments(N),p.logTransaction("department","delete",d),l("success","Department deleted successfully"),t==null||t()}};return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Department Management"}),e.jsxs("button",{onClick:()=>i(!0),className:"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(_e,{className:"w-4 h-4"}),e.jsx("span",{children:"Add Department"})]})]}),y&&e.jsxs("div",{className:`p-4 rounded-lg border flex items-center space-x-3 ${y.type==="success"?"bg-green-50 border-green-200 text-green-800":"bg-red-50 border-red-200 text-red-800"}`,children:[y.type==="success"?e.jsx(Re,{className:"w-5 h-5"}):e.jsx(me,{className:"w-5 h-5"}),e.jsx("span",{children:y.text})]}),r&&e.jsxs("div",{className:"bg-gray-50 rounded-lg p-6 border border-gray-200",children:[e.jsx("h4",{className:"font-semibold text-gray-900 mb-4",children:h?"Edit Department":"Add New Department"}),e.jsxs("form",{onSubmit:j,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Department Name *"}),e.jsx("input",{type:"text",value:v.name,onChange:d=>S({...v,name:d.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",placeholder:"Enter department name",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Description"}),e.jsx("textarea",{value:v.description,onChange:d=>S({...v,description:d.target.value}),rows:3,className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",placeholder:"Enter department description (optional)"})]}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsxs("button",{type:"submit",className:"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(Ue,{className:"w-4 h-4"}),e.jsx("span",{children:h?"Update":"Create"})]}),e.jsxs("button",{type:"button",onClick:I,className:"flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors",children:[e.jsx(re,{className:"w-4 h-4"}),e.jsx("span",{children:"Cancel"})]})]})]})]}),f==="list"?e.jsx(et,{type:"departments",onEdit:w,onDelete:d=>{const N=a.find(D=>D.id===d);N&&R(N)}}):e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200",children:[e.jsx("div",{className:"p-4 border-b border-gray-200",children:e.jsxs("h4",{className:"font-semibold text-gray-900",children:["Existing Departments (",a.length,")"]})}),a.length===0?e.jsxs("div",{className:"p-8 text-center text-gray-500",children:[e.jsx(Ve,{className:"w-12 h-12 text-gray-400 mx-auto mb-4"}),e.jsx("p",{children:"No departments created yet."}),e.jsx("p",{className:"text-sm",children:"Add your first department to get started."})]}):e.jsx("div",{className:"divide-y divide-gray-200",children:a.map(d=>e.jsx("div",{className:"p-4 hover:bg-gray-50",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx("h5",{className:"font-medium text-gray-900",children:d.name}),d.description&&e.jsx("p",{className:"text-sm text-gray-600 mt-1",children:d.description}),e.jsxs("p",{className:"text-xs text-gray-500 mt-2",children:["Created: ",new Date(d.createdAt).toLocaleDateString(),d.lastUpdated!==d.createdAt&&e.jsxs("span",{className:"ml-2",children:["• Updated: ",new Date(d.lastUpdated).toLocaleDateString()]})]})]}),e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>w(d),className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",children:e.jsx(T,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>R(d),className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",children:e.jsx(z,{className:"w-4 h-4"})})]})]})},d.id))})]})]})};export{ut as D,gt as E,_e as P,Xe as Q,z as T,et as U,Je as v};
