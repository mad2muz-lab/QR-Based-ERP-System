import{c as V,r as o,j as e,X as se,D as f,M as De,f as ie,b as Ee,g as le,a as $e}from"./index-OMObVZuK.js";import{g as te,U as qe}from"./qrCodeUtils-CBuP8d3g.js";import{C as Ie}from"./chevron-right-DtpQVrsV.js";import{D as ne}from"./download-CwfSjYaZ.js";import{a as L,S as Pe}from"./square-pen-D340HFVj.js";import{M as Ae,P as Re}from"./phone-BeNAqS0n.js";import{C as Qe}from"./calendar-Cf7BTZ_r.js";import{B as Me}from"./building-Bs78vprY.js";import{P as ze}from"./package-2V884qhv.js";import{W as Le}from"./wrench-By66socw.js";import{S as X}from"./supabaseDataService-D6F1KBYH.js";import{A as oe}from"./alert-circle-DN0yu4Xc.js";import{E as Z}from"./eye-C7qIhwbl.js";import{S as Fe}from"./save-C6Os5Fx5.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=V("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=V("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=V("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=V("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=V("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]),de=(s,a,m="employee")=>{const d=window.open("","_blank");if(!d){alert("Please allow popups to print ID cards");return}const n=m==="employee",j=n?"85.60mm":"210mm",N=n?"53.98mm":"297mm",w=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${n?"Employee ID Card":"QR Label"} - ${s.name}</title>
      <style>
        @page {
          size: ${j} ${N};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${j};
          height: ${N};
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: ${n?"white":"black"};
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        ${n?`
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
      ${n?`
      <div class="card-container">
        <div class="header">
          <div class="company-logo">QR Timecard System</div>
        </div>
        
        <div class="main-content">
          <div class="photo-section">
            <div class="employee-photo">
              ${s.photo?`<img src="${s.photo}" alt="Employee Photo" />`:'<div class="no-photo">No Photo</div>'}
            </div>
          </div>
          
          <div class="info-section">
            <div class="employee-name">${s.name}</div>
            <div class="employee-details">
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${s.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dept:</span>
                <span class="detail-value">${s.department||"N/A"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${s.position||"N/A"}</span>
              </div>
              ${s.bloodGroup?`
              <div class="detail-row">
                <span class="detail-label">Blood:</span>
                <span class="detail-value">${s.bloodGroup}</span>
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
        <div class="label-title">${s.name}</div>
        <div class="label-qr">
          <img src="${a}" alt="QR Code" />
        </div>
        <div class="label-id">${s.id}</div>
        <div class="label-info">
          ${m.charAt(0).toUpperCase()+m.slice(1)} QR Code<br>
          Scan for ${m} operations
        </div>
      </div>
      `}
    </body>
    </html>
  `;d.document.write(w),d.document.close();const g=()=>{setTimeout(()=>{d.print(),setTimeout(()=>{d.close()},1e3)},1e3)};d.document.readyState==="complete"?g():d.onload=g},ce=(s,a)=>{const m=window.open("","_blank");if(!m){alert("Please allow popups to generate employee ID card");return}const d="85.60mm",n="53.98mm";`${s.name}${d}${n}${d}${n}`,s.photo&&`${s.photo}`,`${s.name}${s.position}${s.id}${s.department}${s.bloodGroup||"N/A"}${s.email||"Not provided"}${s.phone||"Not provided"}${a}`;const j=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee ID Card - ${s.name}</title>
      <style>
        @page {
          size: ${d} ${n};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${d};
          height: ${n};
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
              ${s.photo?`<img src="${s.photo}" alt="Employee Photo" />`:'<div class="no-photo">EMPLOYEE<br>PHOTO</div>'}
              <div class="photo-frame"></div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="info-section">
            <div>
              <div class="employee-name">${s.name}</div>
              <div class="employee-title">${s.position}</div>
              
              <div class="employee-details">
                <div class="detail-row">
                  <span class="detail-label">ID No</span>
                  <span class="detail-value id-number">${s.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood</span>
                  <span class="detail-value">${s.bloodGroup||"N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${s.email||"Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${s.phone||"Not provided"}</span>
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
  `;m.document.write(j),m.document.close();const N=()=>{setTimeout(()=>{m.print(),setTimeout(()=>{m.close()},1e3)},1e3)};m.document.readyState==="complete"?N():m.onload=N},Ve=(s,a)=>{const m=window.open("","_blank");if(!m){alert("Please allow popups to download employee ID card");return}const d="85.60mm",n="53.98mm",j=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee ID Card - ${s.name}</title>
      <style>
        @page {
          size: ${d} ${n};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${d};
          height: ${n};
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
              ${s.photo?`<img src="${s.photo}" alt="Employee Photo" />`:'<div class="no-photo">EMPLOYEE<br>PHOTO</div>'}
              <div class="photo-frame"></div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="info-section">
            <div>
              <div class="employee-name">${s.name}</div>
              <div class="employee-title">${s.position}</div>
              
              <div class="employee-details">
                <div class="detail-row">
                  <span class="detail-label">ID No</span>
                  <span class="detail-value id-number">${s.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Dept</span>
                  <span class="detail-value">${s.department}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood</span>
                  <span class="detail-value">${s.bloodGroup||"N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${s.email||"Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${s.phone||"Not provided"}</span>
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
  `;m.document.write(j),m.document.close();const N=()=>{setTimeout(()=>{m.print(),setTimeout(()=>{m.close()},1e3)},1e3)};m.document.readyState==="complete"?N():m.onload=N},Ye=({entity:s,entityType:a,onClose:m,showMultiple:d=!1,entities:n=[]})=>{const[j,N]=o.useState(""),[w,g]=o.useState(!0),[h,C]=o.useState(0),[u,i]=o.useState(s),[A,r]=o.useState([]),E=d?n:[s];o.useEffect(()=>{b(u)},[u]),o.useEffect(()=>{d&&n.length>0?i(n[h]):i(s)},[h,s,n,d]),o.useEffect(()=>{d&&n&&n.length>0&&(async()=>{const q=[];for(const D of n)try{const R=D.qrCode||D.id,T=await te(R);q.push(T)}catch(R){console.error("Error generating QR code:",R),q.push("")}r(q)})()},[d,n]);const b=async c=>{g(!0);try{const q=c.qrCode||c.id,D=await te(q);N(D)}catch(q){console.error("Error generating QR code:",q)}finally{g(!1)}},$=()=>{if(!d||n.length===0)return;const c=window.open("","_blank");if(!c){alert("Please allow popups to print QR codes");return}const q=`
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
        <h1>Bulk QR Codes - ${S(a)}s</h1>
        <div class="qr-grid">
          ${n.map((D,R)=>`
            <div class="qr-item">
              <img class="qr-image" src="${A[R]||""}" alt="QR Code">
              <div class="qr-name">${D.name}</div>
              <div class="qr-id">${D.id}</div>
            </div>
          `).join("")}
        </div>
      </body>
      </html>
    `;c.document.write(q),c.document.close(),c.onload=()=>{setTimeout(()=>{c.print()},1e3)}},v=()=>{a==="employee"?ce(u,j):de(u,j,a)},I=()=>{if(a==="employee")Ve(u,j);else{const c=document.createElement("a");c.href=j,c.download=`${a}-${u.id}-qrcode.png`,document.body.appendChild(c),c.click(),document.body.removeChild(c)}},l=()=>{h<E.length-1&&C(h+1)},y=()=>{h>0&&C(h-1)},S=c=>{switch(c){case"employee":return"Employee";case"equipment":return"Equipment";case"material":return"Material";case"site":return"Site";default:return"Item"}};return e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",children:e.jsxs("div",{className:"bg-white rounded-xl shadow-2xl w-full max-w-md p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:[S(a)," QR Code",d?"s":"",d&&` (${h+1}/${E.length})`]}),e.jsx("button",{onClick:m,className:"text-gray-400 hover:text-gray-600 transition-colors",children:e.jsx(se,{className:"w-5 h-5"})})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("h4",{className:"font-medium text-gray-900 text-lg",children:u.name}),e.jsx("p",{className:"text-gray-600",children:a==="employee"?u.position:a==="equipment"?u.model:a==="material"?`${u.quantity} ${u.unit}`:u.province}),e.jsxs("p",{className:"text-sm text-gray-500 mt-1",children:["ID: ",u.id]})]}),e.jsx("div",{className:"flex justify-center",children:w?e.jsx("div",{className:"w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"})}):e.jsx("div",{className:"p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm",children:e.jsx("img",{src:j,alt:`QR Code for ${u.name}`,className:"w-64 h-64"})})}),d&&E.length>1&&e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("button",{onClick:y,disabled:h===0,className:"p-2 bg-gray-100 rounded-full disabled:opacity-50",children:e.jsx(Oe,{className:"w-5 h-5"})}),e.jsxs("span",{className:"text-sm text-gray-600",children:[h+1," of ",E.length]}),e.jsx("button",{onClick:l,disabled:h===E.length-1,className:"p-2 bg-gray-100 rounded-full disabled:opacity-50",children:e.jsx(Ie,{className:"w-5 h-5"})})]}),d&&E.length>1&&e.jsx("div",{className:"mt-4 pt-4 border-t border-gray-200",children:e.jsxs("button",{onClick:$,className:"w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors",children:[e.jsx(P,{className:"w-4 h-4"}),e.jsxs("span",{children:["Print All QR Codes (",E.length,")"]})]})}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsxs("button",{onClick:v,className:"flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(P,{className:"w-4 h-4"}),e.jsx("span",{children:a==="employee"?"Print ID Card":"Print QR Label"})]}),e.jsxs("button",{onClick:I,className:"flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors",children:[e.jsx(ne,{className:"w-4 h-4"}),e.jsx("span",{children:"Download"})]})]})]})]})})},He=({entity:s,entityType:a,onClose:m,onEdit:d})=>{const[n,j]=o.useState(""),[N,w]=o.useState(!0),[g,h]=o.useState([]);o.useEffect(()=>{u(),C()},[s]);const C=()=>{h(f.loadSites())},u=async()=>{w(!0);try{const v=s.qrCode||s.id,I=await te(v);j(I)}catch(v){console.error("Error generating QR code:",v)}finally{w(!1)}},i=()=>{a==="employee"?ce(s,n):de(s,n,a)},A=()=>{const v=document.createElement("a");v.href=n,v.download=`${a}-${s.id}-qrcode.png`,document.body.appendChild(v),v.click(),document.body.removeChild(v)},r=v=>{const I=g.find(l=>l.id===v);return I?I.name:"Unknown Site"},E=v=>{switch(v){case"active":case"available":return"bg-green-100 text-green-800 border-green-200";case"inactive":case"down":return"bg-red-100 text-red-800 border-red-200";case"in-use":return"bg-blue-100 text-blue-800 border-blue-200";case"maintenance":case"low-stock":return"bg-yellow-100 text-yellow-800 border-yellow-200";case"out-of-stock":return"bg-red-100 text-red-800 border-red-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},$=(()=>{switch(a){case"employee":return ie;case"equipment":return Le;case"material":return ze;case"site":return Me;default:return ie}})();return e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",children:e.jsxs("div",{className:"bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex items-center justify-between p-6 border-b border-gray-200",children:[e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx($,{className:`w-6 h-6 ${a==="employee"?"text-blue-600":a==="equipment"?"text-green-600":a==="material"?"text-orange-600":"text-purple-600"}`}),e.jsxs("h2",{className:"text-xl font-semibold text-gray-900",children:[a.charAt(0).toUpperCase()+a.slice(1)," Profile"]})]}),e.jsx("button",{onClick:m,className:"text-gray-400 hover:text-gray-600",children:e.jsx(se,{className:"w-6 h-6"})})]}),e.jsx("div",{className:"p-6",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:[e.jsx("div",{className:"md:col-span-1",children:e.jsxs("div",{className:"bg-gray-50 rounded-lg p-6 flex flex-col items-center",children:[N?e.jsx("div",{className:"w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"})}):e.jsx("img",{src:n,alt:`QR Code for ${s.name}`,className:"w-48 h-48 border-2 border-gray-200 rounded-lg"}),e.jsxs("div",{className:"mt-4 text-center",children:[e.jsxs("p",{className:"text-sm text-gray-500",children:["ID: ",s.id]}),e.jsxs("div",{className:"flex space-x-2 mt-4",children:[e.jsxs("button",{onClick:i,className:"flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm",children:[e.jsx(P,{className:"w-3 h-3"}),e.jsx("span",{children:"Print"})]}),e.jsxs("button",{onClick:A,className:"flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm",children:[e.jsx(P,{className:"w-3 h-3"}),e.jsx("span",{children:"Download"})]})]})]})]})}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900",children:s.name}),a==="employee"&&e.jsxs("p",{className:"text-gray-600",children:[s.position," • ",s.department]}),a==="equipment"&&e.jsxs("p",{className:"text-gray-600",children:[s.type," • ",s.model]}),a==="material"&&e.jsxs("p",{className:"text-gray-600",children:[s.type," • ",s.quantity," ",s.unit]}),a==="site"&&e.jsxs("p",{className:"text-gray-600",children:[s.type||"Site"," • ",s.province]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[s.status&&e.jsx("span",{className:`px-3 py-1 rounded-full text-sm font-medium border ${E(s.status)}`,children:s.status.toUpperCase()}),e.jsxs("button",{onClick:d,className:"flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors",children:[e.jsx(L,{className:"w-4 h-4"}),e.jsx("span",{children:"Edit"})]})]})]}),e.jsxs("div",{className:"space-y-6",children:[a==="employee"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Department"}),e.jsx("p",{className:"text-gray-900",children:s.department})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Position"}),e.jsx("p",{className:"text-gray-900",children:s.position})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Site"}),e.jsx("p",{className:"text-gray-900",children:r(s.site)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Type"}),e.jsx("p",{className:"text-gray-900",children:s.type||"Not specified"})]}),s.bloodGroup&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Blood Group"}),e.jsx("p",{className:"text-gray-900",children:s.bloodGroup})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Contact Information"}),e.jsxs("div",{className:"space-y-2",children:[s.email&&e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Ae,{className:"w-4 h-4 text-gray-400"}),e.jsx("span",{className:"text-gray-900",children:s.email})]}),s.phone&&e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Re,{className:"w-4 h-4 text-gray-400"}),e.jsx("span",{className:"text-gray-900",children:s.phone})]}),!s.email&&!s.phone&&e.jsx("p",{className:"text-gray-500",children:"No contact information provided"})]})]})]}),a==="equipment"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Type"}),e.jsx("p",{className:"text-gray-900",children:s.type})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Model"}),e.jsx("p",{className:"text-gray-900",children:s.model})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Site"}),e.jsx("p",{className:"text-gray-900",children:r(s.site)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Status"}),e.jsx("p",{className:"text-gray-900",children:s.status})]}),s.serialNumber&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Serial Number"}),e.jsx("p",{className:"text-gray-900",children:s.serialNumber})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Registration Information"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Created"}),e.jsx("p",{className:"text-gray-900",children:new Date(s.createdAt).toLocaleDateString()})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Last Updated"}),e.jsx("p",{className:"text-gray-900",children:new Date(s.lastUpdated).toLocaleDateString()})]})]})]})]}),a==="material"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Type"}),e.jsx("p",{className:"text-gray-900",children:s.type})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Unit"}),e.jsx("p",{className:"text-gray-900",children:s.unit})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Quantity"}),e.jsxs("p",{className:"text-gray-900",children:[s.quantity," ",s.unit]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Site"}),e.jsx("p",{className:"text-gray-900",children:r(s.site)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Status"}),e.jsx("p",{className:"text-gray-900",children:s.status})]})]}),s.use&&e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Usage Description"}),e.jsx("p",{className:"text-gray-900",children:s.use})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Registration Information"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Created"}),e.jsx("p",{className:"text-gray-900",children:new Date(s.createdAt).toLocaleDateString()})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Last Updated"}),e.jsx("p",{className:"text-gray-900",children:new Date(s.lastUpdated).toLocaleDateString()})]})]})]})]}),a==="site"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Province"}),e.jsx("p",{className:"text-gray-900",children:s.province})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Manager"}),e.jsx("p",{className:"text-gray-900",children:s.manager})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Address"}),e.jsx("p",{className:"text-gray-900",children:s.address})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Coordinates"}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(De,{className:"w-4 h-4 text-gray-400"}),e.jsxs("p",{className:"text-gray-900",children:[s.coordinates[1].toFixed(4),", ",s.coordinates[0].toFixed(4)]})]})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4 mt-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-3",children:"Registration Information"}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-500 mb-1",children:"Last Updated"}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Qe,{className:"w-4 h-4 text-gray-400"}),e.jsx("p",{className:"text-gray-900",children:new Date(s.lastUpdated).toLocaleDateString()})]})]})]})]})]})]})})]})})]})})},Ue=({type:s,onEdit:a,onDelete:m,onImport:d,onExport:n,refreshTrigger:j})=>{const[N,w]=o.useState([]),[g,h]=o.useState([]),[C,u]=o.useState(""),[i,A]=o.useState("name"),[r,E]=o.useState("asc"),[b,$]=o.useState([]),[v,I]=o.useState(!1),[l,y]=o.useState(null),[S,c]=o.useState(!1),[q,D]=o.useState([]),[R,T]=o.useState(!1),[J,me]=o.useState(null),[Y,xe]=o.useState(""),[H,pe]=o.useState(""),[U,he]=o.useState(""),[B,ge]=o.useState(""),ae=Ee.useRef(null),F=le.getCurrentUserSync(),k=(F==null?void 0:F.role)==="admin"||(F==null?void 0:F.role)==="developer";o.useEffect(()=>{(async()=>{await ue()})()},[s,j]),o.useEffect(()=>{be()},[N,C,i,r,Y,H,U,B]);const ue=async()=>{let t=[];const x=le.useSupabase();try{if(x)switch(s){case"employees":t=await X.getEmployees();break;case"equipment":t=await X.getEquipment();break;case"materials":t=await X.getMaterials();break;case"sites":t=await X.getSites();break;case"departments":t=f.loadDepartments();break}else switch(s){case"employees":t=f.loadEmployees();break;case"equipment":t=f.loadEquipment();break;case"materials":t=f.loadMaterials();break;case"sites":t=f.loadSites();break;case"departments":t=f.loadDepartments();break}}catch(Q){switch(console.error(`Error loading ${s}:`,Q),s){case"employees":t=f.loadEmployees();break;case"equipment":t=f.loadEquipment();break;case"materials":t=f.loadMaterials();break;case"sites":t=f.loadSites();break;case"departments":t=f.loadDepartments();break}}w(t),$([])},be=()=>{let t=[...N];C&&(t=t.filter(x=>["name","id","type","department","position","model","province","manager"].some(M=>x[M]&&x[M].toString().toLowerCase().includes(C.toLowerCase())))),Y&&(s==="employees"||s==="equipment"||s==="materials")&&(t=t.filter(x=>x.status===Y)),H&&(s==="equipment"||s==="materials"||s==="sites")&&(t=t.filter(x=>x.type===H)),U&&s==="employees"&&(t=t.filter(x=>x.department===U)),B&&(s==="employees"||s==="equipment"||s==="materials")&&(t=t.filter(x=>x.site===B)),t.sort((x,Q)=>{const M=x[i]||"",re=Q[i]||"";return r==="asc"?M.toString().localeCompare(re.toString()):re.toString().localeCompare(M.toString())}),h(t)},p=t=>{i===t?E(r==="asc"?"desc":"asc"):(A(t),E("asc"))},O=t=>{t.target.checked?$(g.map(x=>x.id)):$([])},W=t=>{b.includes(t)?$(b.filter(x=>x!==t)):$([...b,t])},fe=()=>{D(b),c(!0)},ve=()=>{q.forEach(t=>{m(t)}),c(!1),D([]),$([])},G=t=>{y(t),I(!0)},_=t=>{me(t),T(!0)},ye=()=>{switch(s){case"employees":return["active","inactive"];case"equipment":return["available","in-use","maintenance","down"];case"materials":return["available","low-stock","out-of-stock"];default:return[]}},je=()=>{const t=new Set;return N.forEach(x=>{x.type&&t.add(x.type)}),Array.from(t)},Ne=()=>{const t=new Set;return N.forEach(x=>{x.department&&t.add(x.department)}),Array.from(t)},we=()=>f.loadSites().map(x=>({id:x.id,name:x.name})),K=t=>{const Q=f.loadSites().find(M=>M.id===t);return Q?Q.name:"Unknown Site"},ee=t=>{switch(t){case"active":case"available":return"bg-green-100 text-green-800";case"inactive":case"down":return"bg-red-100 text-red-800";case"in-use":return"bg-blue-100 text-blue-800";case"maintenance":case"low-stock":return"bg-yellow-100 text-yellow-800";case"out-of-stock":return"bg-red-100 text-red-800";default:return"bg-gray-100 text-gray-800"}},ke=()=>{switch(s){case"employees":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:b.length===g.length&&g.length>0,onChange:O,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("id"),children:["ID ",i==="id"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("name"),children:["Name ",i==="name"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("department"),children:["Department ",i==="department"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("position"),children:["Position ",i==="position"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("site"),children:["Site ",i==="site"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("status"),children:["Status ",i==="status"&&(r==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"equipment":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:b.length===g.length&&g.length>0,onChange:O,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("id"),children:["ID ",i==="id"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("name"),children:["Name ",i==="name"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("type"),children:["Type ",i==="type"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("model"),children:["Model ",i==="model"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("site"),children:["Site ",i==="site"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("status"),children:["Status ",i==="status"&&(r==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"materials":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:b.length===g.length&&g.length>0,onChange:O,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("id"),children:["ID ",i==="id"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("name"),children:["Name ",i==="name"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("type"),children:["Type ",i==="type"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("quantity"),children:["Quantity ",i==="quantity"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("site"),children:["Site ",i==="site"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("status"),children:["Status ",i==="status"&&(r==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"sites":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:b.length===g.length&&g.length>0,onChange:O,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("id"),children:["ID ",i==="id"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("name"),children:["Name ",i==="name"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("type"),children:["Type ",i==="type"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("province"),children:["Province ",i==="province"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("manager"),children:["Manager ",i==="manager"&&(r==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});case"departments":return e.jsxs("tr",{className:"bg-gray-50 border-b border-gray-200",children:[k&&e.jsx("th",{className:"px-4 py-3 text-left",children:e.jsx("input",{type:"checkbox",checked:b.length===g.length&&g.length>0,onChange:O,className:"rounded border-gray-300"})}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("id"),children:["ID ",i==="id"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("name"),children:["Name ",i==="name"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("description"),children:["Description ",i==="description"&&(r==="asc"?"↑":"↓")]}),e.jsxs("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",onClick:()=>p("createdAt"),children:["Created ",i==="createdAt"&&(r==="asc"?"↑":"↓")]}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]});default:return null}},Ce=t=>{switch(s){case"employees":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:b.includes(t.id),onChange:()=>W(t.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.id}),e.jsx("td",{className:"px-4 py-3",children:e.jsxs("div",{className:"flex items-center",children:[t.photo?e.jsx("img",{src:t.photo,alt:t.name,className:"w-8 h-8 rounded-full mr-3"}):e.jsx("div",{className:"w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center",children:e.jsx("span",{className:"text-gray-500 text-xs",children:t.name.charAt(0)})}),e.jsx("div",{className:"text-sm font-medium text-gray-900",children:t.name})]})}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.department}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.position}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:K(t.site)}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("span",{className:`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ee(t.status)}`,children:t.status})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>_(t),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(Z,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(t),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(L,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(t),className:"text-green-600 hover:text-green-900",title:"ID Card",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{D([t.id]),c(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},t.id);case"equipment":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:b.includes(t.id),onChange:()=>W(t.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.type}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.model}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:K(t.site)}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("span",{className:`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ee(t.status)}`,children:t.status})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>_(t),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(Z,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(t),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(L,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(t),className:"text-green-600 hover:text-green-900",title:"QR Code",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{D([t.id]),c(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},t.id);case"materials":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:b.includes(t.id),onChange:()=>W(t.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.type}),e.jsxs("td",{className:"px-4 py-3 text-sm text-gray-500",children:[t.quantity," ",t.unit]}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:K(t.site)}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("span",{className:`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ee(t.status)}`,children:t.status})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>_(t),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(Z,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(t),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(L,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(t),className:"text-green-600 hover:text-green-900",title:"QR Code",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{D([t.id]),c(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},t.id);case"sites":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:b.includes(t.id),onChange:()=>W(t.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.type||"N/A"}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.province}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.manager}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>_(t),className:"text-purple-600 hover:text-purple-900",title:"View Profile",children:e.jsx(Z,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>a(t),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(L,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>G(t),className:"text-green-600 hover:text-green-900",title:"QR Code",children:e.jsx(P,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{D([t.id]),c(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},t.id);case"departments":return e.jsxs("tr",{className:"border-b border-gray-200 hover:bg-gray-50",children:[k&&e.jsx("td",{className:"px-4 py-3",children:e.jsx("input",{type:"checkbox",checked:b.includes(t.id),onChange:()=>W(t.id),className:"rounded border-gray-300"})}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.id}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium text-gray-900",children:t.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:t.description||"N/A"}),e.jsx("td",{className:"px-4 py-3 text-sm text-gray-500",children:new Date(t.createdAt).toLocaleDateString()}),e.jsx("td",{className:"px-4 py-3 text-sm font-medium",children:e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>a(t),className:"text-blue-600 hover:text-blue-900",title:"Edit",children:e.jsx(L,{className:"w-4 h-4"})}),k&&e.jsx("button",{onClick:()=>{D([t.id]),c(!0)},className:"text-red-600 hover:text-red-900",title:"Delete",children:e.jsx(z,{className:"w-4 h-4"})})]})})]},t.id);default:return null}},Se=()=>e.jsxs("div",{className:"flex flex-wrap gap-3 mb-4",children:[e.jsxs("div",{className:"relative flex-grow max-w-xs",children:[e.jsx(Pe,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"}),e.jsx("input",{type:"text",placeholder:`Search ${s}...`,value:C,onChange:t=>u(t.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]}),(s==="employees"||s==="equipment"||s==="materials")&&e.jsxs("select",{value:Y,onChange:t=>xe(t.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Status"}),ye().map(t=>e.jsx("option",{value:t,children:t},t))]}),(s==="equipment"||s==="materials"||s==="sites")&&e.jsxs("select",{value:H,onChange:t=>pe(t.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Types"}),je().map(t=>e.jsx("option",{value:t,children:t},t))]}),s==="employees"&&e.jsxs("select",{value:U,onChange:t=>he(t.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Departments"}),Ne().map(t=>e.jsx("option",{value:t,children:t},t))]}),(s==="employees"||s==="equipment"||s==="materials")&&e.jsxs("select",{value:B,onChange:t=>ge(t.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"",children:"All Sites"}),we().map(t=>e.jsx("option",{value:t.id,children:t.name},t.id))]}),e.jsxs("div",{className:"flex space-x-2 ml-auto",children:[d&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>{var t;return(t=ae.current)==null?void 0:t.click()},className:"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(qe,{className:"w-4 h-4"}),e.jsx("span",{children:"Import"})]}),e.jsx("input",{ref:ae,type:"file",accept:".xlsx,.xls",onChange:d,className:"hidden"})]}),n&&e.jsxs("button",{onClick:n,className:"flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors",children:[e.jsx(ne,{className:"w-4 h-4"}),e.jsx("span",{children:"Export"})]})]})]});return e.jsxs("div",{className:"space-y-4",children:[Se(),k&&b.length>0&&e.jsxs("div",{className:"bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center justify-between mb-4",children:[e.jsxs("div",{className:"text-sm text-blue-800",children:[e.jsx("span",{className:"font-medium",children:b.length})," ",s," selected"]}),e.jsxs("button",{onClick:fe,className:"flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",children:[e.jsx(z,{className:"w-4 h-4"}),e.jsx("span",{children:"Delete Selected"})]})]}),e.jsx("div",{className:"bg-white rounded-lg border border-gray-200 overflow-hidden",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{children:ke()}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:g.length>0?g.map(t=>Ce(t)):e.jsx("tr",{children:e.jsxs("td",{colSpan:k?8:7,className:"px-4 py-8 text-center text-gray-500",children:["No ",s," found. ",C&&`Try adjusting your search for "${C}".`]})})})]})})}),v&&l&&e.jsx(Ye,{entity:l,entityType:s.slice(0,-1),onClose:()=>I(!1)}),R&&J&&e.jsx(He,{entity:J,entityType:s.slice(0,-1),onClose:()=>T(!1),onEdit:()=>{T(!1),a(J)}}),S&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",children:e.jsxs("div",{className:"bg-white rounded-xl shadow-2xl w-full max-w-md p-6",children:[e.jsxs("div",{className:"flex items-center space-x-3 mb-4",children:[e.jsx(oe,{className:"w-6 h-6 text-red-600"}),e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Confirm Deletion"})]}),e.jsxs("p",{className:"text-gray-600 mb-6",children:["Are you sure you want to delete ",q.length===1?"this item":`these ${q.length} items`,"? This action cannot be undone."]}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsx("button",{onClick:ve,className:"flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors",children:"Delete"}),e.jsx("button",{onClick:()=>c(!1),className:"flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors",children:"Cancel"})]})]})})]})},nt=({onDepartmentUpdate:s})=>{const[a,m]=o.useState([]),[d,n]=o.useState(!1),[j,N]=o.useState("card"),[w,g]=o.useState(null),[h,C]=o.useState({name:"",description:""}),[u,i]=o.useState(null);o.useEffect(()=>{A()},[]);const A=()=>{const l=f.loadDepartments();m(l)},r=(l,y)=>{i({type:l,text:y}),setTimeout(()=>i(null),3e3)},E=(l,y)=>{const S=l.trim().toLowerCase();return!a.some(c=>c.name.toLowerCase()===S&&c.id!==y)},b=l=>{if(l.preventDefault(),!h.name.trim()){r("error","Department name is required");return}if(!E(h.name,w==null?void 0:w.id)){r("error","Department name already exists");return}if(w){const y={...w,name:h.name.trim(),description:h.description.trim(),lastUpdated:new Date().toISOString()},S=a.map(c=>c.id===w.id?y:c);m(S),f.saveDepartments(S),f.logTransaction("department","update",y),r("success","Department updated successfully")}else{const y={id:`dept-${Date.now()}`,name:h.name.trim(),description:h.description.trim(),createdAt:new Date().toISOString(),lastUpdated:new Date().toISOString()},S=[...a,y];m(S),f.saveDepartments(S),f.logTransaction("department","create",y),r("success","Department created successfully")}$(),s==null||s()},$=()=>{C({name:"",description:""}),g(null),n(!1)},v=l=>{g(l),C({name:l.name,description:l.description||""}),n(!0)},I=l=>{if(window.confirm(`Are you sure you want to delete "${l.name}"?`)){const y=a.filter(S=>S.id!==l.id);m(y),f.saveDepartments(y),f.logTransaction("department","delete",l),r("success","Department deleted successfully"),s==null||s()}};return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Department Management"}),e.jsxs("button",{onClick:()=>n(!0),className:"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(We,{className:"w-4 h-4"}),e.jsx("span",{children:"Add Department"})]})]}),u&&e.jsxs("div",{className:`p-4 rounded-lg border flex items-center space-x-3 ${u.type==="success"?"bg-green-50 border-green-200 text-green-800":"bg-red-50 border-red-200 text-red-800"}`,children:[u.type==="success"?e.jsx($e,{className:"w-5 h-5"}):e.jsx(oe,{className:"w-5 h-5"}),e.jsx("span",{children:u.text})]}),d&&e.jsxs("div",{className:"bg-gray-50 rounded-lg p-6 border border-gray-200",children:[e.jsx("h4",{className:"font-semibold text-gray-900 mb-4",children:w?"Edit Department":"Add New Department"}),e.jsxs("form",{onSubmit:b,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Department Name *"}),e.jsx("input",{type:"text",value:h.name,onChange:l=>C({...h,name:l.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",placeholder:"Enter department name",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Description"}),e.jsx("textarea",{value:h.description,onChange:l=>C({...h,description:l.target.value}),rows:3,className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",placeholder:"Enter department description (optional)"})]}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsxs("button",{type:"submit",className:"flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",children:[e.jsx(Fe,{className:"w-4 h-4"}),e.jsx("span",{children:w?"Update":"Create"})]}),e.jsxs("button",{type:"button",onClick:$,className:"flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors",children:[e.jsx(se,{className:"w-4 h-4"}),e.jsx("span",{children:"Cancel"})]})]})]})]}),j==="list"?e.jsx(Ue,{type:"departments",onEdit:v,onDelete:l=>{const y=a.find(S=>S.id===l);y&&I(y)}}):e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200",children:[e.jsx("div",{className:"p-4 border-b border-gray-200",children:e.jsxs("h4",{className:"font-semibold text-gray-900",children:["Existing Departments (",a.length,")"]})}),a.length===0?e.jsxs("div",{className:"p-8 text-center text-gray-500",children:[e.jsx(Te,{className:"w-12 h-12 text-gray-400 mx-auto mb-4"}),e.jsx("p",{children:"No departments created yet."}),e.jsx("p",{className:"text-sm",children:"Add your first department to get started."})]}):e.jsx("div",{className:"divide-y divide-gray-200",children:a.map(l=>e.jsx("div",{className:"p-4 hover:bg-gray-50",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx("h5",{className:"font-medium text-gray-900",children:l.name}),l.description&&e.jsx("p",{className:"text-sm text-gray-600 mt-1",children:l.description}),e.jsxs("p",{className:"text-xs text-gray-500 mt-2",children:["Created: ",new Date(l.createdAt).toLocaleDateString(),l.lastUpdated!==l.createdAt&&e.jsxs("span",{className:"ml-2",children:["• Updated: ",new Date(l.lastUpdated).toLocaleDateString()]})]})]}),e.jsxs("div",{className:"flex space-x-2",children:[e.jsx("button",{onClick:()=>v(l),className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",children:e.jsx(L,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>I(l),className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",children:e.jsx(z,{className:"w-4 h-4"})})]})]})},l.id))})]})]})};export{nt as D,We as P,Ye as Q,z as T,Ue as U};
