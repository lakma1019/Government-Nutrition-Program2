// components/FormNew2.tsx
import React from 'react';

const FormNew2: React.FC = () => {
  return (
    <>
      <div className="form-container">
        {/* SECTION 1: Receipt Details Sinhala */}
        <div className="form-section">
            <div className="form-line">
                <span className="label-fixed">පසු පිටේ සඳහන් ගණනය වෙනුවෙන් රුපියල්</span>
                <span className="dots-fill dots-long"></span>
                <span className="label-fixed">ශත</span>
            </div>
            <div className="form-line">
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill"></span>
                <span className="label-fixed">මස</span>
                <span className="dots-fill dots-short"></span>
                <span className="label-fixed">වැනිදා</span>
            </div>
            <div className="form-line">
                <span>වන මෙදින බාර ගතිමි.</span>
            </div>
        </div>

        {/* SECTION 2: Receipt Details Tamil */}
        <div className="form-section">
            <div className="form-line">
                <span className="label-fixed">ரூபா.</span>
                <span className="dots-fill dots-long"></span>
                <span className="label-fixed">சதம்.</span>
            </div>
            <div className="form-line">
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill"></span>
                <span className="label-fixed">மாதம்</span>
                <span className="dots-fill dots-short"></span>
                <span className="label-fixed">ஆம் நாளாகிய இன்று பெற்றுக்கொண்டேன்.</span>
            </div>
        </div>

        {/* SECTION 3: Receipt Details English */}
        <div className="form-section">
            <div className="form-line">
                <span className="label-fixed">RECEIVED this</span>
                <span className="dots-fill dots-medium"></span>
                <span className="label-fixed">day of</span>
                <span className="dots-fill dots-medium"></span>
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill dots-short"></span>
                <span className="label-fixed">in</span>
            </div>
            <div className="form-line">
                <span className="label-fixed">payment of the Account, overleaf the sum of Rupees</span>
                <span className="dots-fill"></span>
                <span className="label-fixed">and</span>
            </div>
            <div className="form-line">
                <span className="label-fixed">cents</span>
                <span className="dots-fill dots-long"></span>
            </div>
        </div>

        {/* SECTION 4: Witnesses */}
        <div className="witnesses-section">
            <div className="labels-group">
                <p>සාක්ෂිකාරයෝ</p>
                <p>சாட்சி</p>
                <p>Witnesses</p>
            </div>
            <span className="curly-brace">}</span>
        </div>

        {/* SECTION 5: Stamp Box and Receiver Signature (All on the right) */}
        <div className="stamp-and-signature-area-right">
            <div className="stamp-box">
                <p>මුද්දර ගාස්තු පනත අනුව මුද්දර අලවන්න.</p>
                <p>முத்திரைத் தீர்வைச் சட்டப்படி ஏற்ற முத்திரை ஒட்டுக.</p>
                <p>Affix Stamp as per Stamp Duty Act</p>
            </div>
            <div className="signature-line-and-text">
                <div className="external-signature-dotted-line"></div>
                <div className="signature-text-block">
                    <p>ලබාගන්නාගේ අත්සන</p>
                    <p>பெறுபவரின் கையொப்பம்</p>
                    <p>Signature of Receiver</p>
                </div>
            </div>
        </div>

        {/* SECTION 6: Paying Officer (Boxed) */}
        <div className="paying-officer-boxed-section">
            <div className="paying-officer-content">
                <div className="labels-group">
                    <p>ගෙවන නිලධාරියාගේ අත්සන සහ දිනය</p>
                    <p>வழங்கும் அலுவலரின் கையொப்பமும் திகதியும்</p>
                    <p>Signature of Paying Officer and Date</p>
                </div>
                <span className="curly-brace">}</span>
                <span className="dots-fill dots-long"></span>
            </div>
        </div>

        <hr className="hr-separator" />

        {/* SECTION 7: Warrant Details */}
        <div className="form-section warrant-section">
            <div className="form-line">
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill dots-short"></span>
                <span className="warrant-text-block">වැනි සාමාන්‍ය / විශේෂ බලපත්‍ර / ஆம் திகதிய விசேட அதிகாரப் பத்திர
                    இல.:</span>
                <span className="dots-fill"></span>
            </div>
            <div className="form-line indented-line">
                <span className="label-fixed">பத்திர இல.:</span>
                <span className="dots-fill dots-medium"></span>
                <span className="label-fixed">General/Special Warrant No.</span>
                <span className="dots-fill"></span>
                <span className="label-fixed">of</span>
            </div>
            <div className="form-line indented-line">
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill dots-long"></span>
            </div>

            <div className="form-line" style={{ marginTop: 'var(--spacing-unit)' }}>
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill dots-short"></span>
                <span className="warrant-text-block">වැනි අත්තිකාරම්/වගකීම් මුදල් බලපත්‍ර/ முன்பண / பொறுப்பு அதிகாரப் பத்திர
                    இல.</span>
                <span className="dots-fill"></span>
            </div>
            <div className="form-line indented-line">
                <span className="label-fixed">Advance/ Imprest Warrant No.</span>
                <span className="dots-fill dots-long"></span>
            </div>

            <div className="form-line" style={{ marginTop: 'var(--spacing-unit)' }}>
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill dots-short"></span>
                <span className="warrant-text-block">වැනි බලය ஆம் திகதிய அதிகாரப் பத்திர இல</span>
                <span className="dots-fill"></span>
                <span className="label-fixed label-fixed-sm">20</span>
                <span className="dots-fill dots-short"></span>
            </div>
            <div className="form-line indented-line">
                <span className="label-fixed">Authority No.</span>
                <span className="dots-fill dots-medium"></span>
                <span className="label-fixed">of 20</span>
                <span className="dots-fill dots-long"></span>
            </div>
        </div>

        {/* FOOTER */}
        <footer className="form-footer">
            <p>H – 058659 – 1.000.000 (2023/06) P ශ්‍රී ලංකා රජයේ මුද්‍රණ දෙපාර්තමේන්තුව</p>
        </footer>
      </div>
      <style jsx global>{`
        :root {
            --primary-font: 'Noto Sans Sinhala', 'Noto Sans Tamil', 'Roboto', Arial, sans-serif;
            --text-color: #000000;
            --line-color: #333333;
            --border-color: #cccccc;
            --stamp-box-border-color: #333333;

            --font-size-normal: 10pt;
            --font-size-small: 8pt;
            --font-size-x-small: 7.5pt;
            --font-size-large-brace: 3.8em;

            --spacing-unit: 8px; /* Re-declaring for clarity, ensure compatibility if used with FormNew1 vars */
            --line-height-normal: 1.5;
            --line-height-tight: 1.25;
            --line-height-very-tight: 1.1;

            --dot-vertical-offset: -4px;
        }

        body { /* Applied globally when this component is active */
            font-family: var(--primary-font);
            font-size: var(--font-size-normal);
            color: var(--text-color);
            line-height: var(--line-height-normal);
            margin: 0;
            background-color: #f0f0f0;
            padding: calc(var(--spacing-unit) * 2);
        }

        .form-container {
            background-color: #ffffff;
            max-width: 680px;
            margin: 0 auto;
            padding: calc(var(--spacing-unit) * 3);
            border: 1px solid var(--border-color);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
        }

        .form-section {
            margin-bottom: calc(var(--spacing-unit) * 1.25);
        }

        .form-section:last-of-type {
            margin-bottom: 0;
        }

        .form-line {
            display: flex;
            align-items: baseline;
            margin-bottom: calc(var(--spacing-unit) * 0.4);
            flex-wrap: nowrap;
        }

        .form-line > span,
        .form-line > div {
            white-space: nowrap;
            margin-right: calc(var(--spacing-unit) * 0.35);
        }

        .form-line > span:last-child,
        .form-line > div:last-child {
            margin-right: 0;
        }

        .label-fixed {
            flex-shrink: 0;
        }

        .label-fixed-sm {
            width: 25px;
            flex-shrink: 0;
        }

        .label-fixed-md {
            width: 45px;
            flex-shrink: 0;
        }


        .dots-fill {
            flex-grow: 1;
            border-bottom: 0.75px dotted var(--line-color);
            margin-left: calc(var(--spacing-unit) * 0.25);
            margin-right: calc(var(--spacing-unit) * 0.25);
            margin-bottom: var(--dot-vertical-offset);
            min-width: 10px;
            height: 0.8em;
        }

        .dots-short {
            flex-grow: 0.2;
            min-width: 30px;
        }

        .dots-medium {
            flex-grow: 0.5;
            min-width: 50px;
        }

        .dots-long {
            flex-grow: 2;
        }


        .labels-group {
            line-height: var(--line-height-tight);
        }

        .labels-group p {
            margin: 1px 0;
            font-size: var(--font-size-normal); /* Uses 10pt from this form's :root */
        }

        .curly-brace {
            font-size: var(--font-size-large-brace);
            line-height: 0.7;
            font-weight: lighter;
            margin-left: var(--spacing-unit);
            color: var(--text-color);
        }

        .hr-separator {
            border: 0;
            border-top: 0.75px solid var(--border-color);
            margin: calc(var(--spacing-unit) * 2.5) 0;
        }

        .warrant-section .form-line {
            margin-bottom: calc(var(--spacing-unit) * 0.3);
        }

        .warrant-text-block {
            line-height: var(--line-height-tight);
            margin-right: calc(var(--spacing-unit) * 0.5);
        }

        .indented-line {
            padding-left: calc(var(--spacing-unit) * 2);
        }

        .indented-line .label-fixed {
            margin-left: calc(var(--spacing-unit) * -2);
        }
        
        .form-footer {
            text-align: center;
            font-size: var(--font-size-small); /* Uses 8pt from this form's :root */
            margin-top: calc(var(--spacing-unit) * 3);
            border-top: 1px solid var(--border-color);
            padding-top: var(--spacing-unit);
        }

        .witnesses-section {
            display: flex;
            align-items: center;
            margin-bottom: calc(var(--spacing-unit) * 3);
        }

        .stamp-and-signature-area-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            width: fit-content;
            margin-left: auto;
            margin-bottom: calc(var(--spacing-unit) * 2.5);
        }

        .stamp-box {
            border: 1px dotted var(--stamp-box-border-color);
            padding: calc(var(--spacing-unit) * 0.75) var(--spacing-unit);
            text-align: center;
            font-size: var(--font-size-x-small); /* Uses 7.5pt */
            line-height: var(--line-height-very-tight);
            width: 170px;
            flex-shrink: 0;
            margin-bottom: var(--spacing-unit);
        }

        .stamp-box p {
            margin: calc(var(--spacing-unit) * 0.25) 0;
        }

        .signature-line-and-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 220px;
        }

        .external-signature-dotted-line {
            width: 100%;
            border-bottom: 0.75px dotted var(--line-color);
            margin-bottom: calc(var(--spacing-unit) * 0.5);
        }

        .signature-text-block {
            text-align: center;
            font-size: var(--font-size-small); /* Uses 8pt */
            line-height: var(--line-height-tight);
        }

        .signature-text-block p {
            margin: 0;
        }

        .paying-officer-boxed-section {
            border: 1px solid var(--text-color);
            padding: var(--spacing-unit);
            margin-top: calc(var(--spacing-unit) * 1.5);
        }

        .paying-officer-content {
            display: flex;
            align-items: center;
        }

        .paying-officer-content .curly-brace {
            margin-right: calc(var(--spacing-unit) * 0.5);
        }

        .paying-officer-content .dots-fill {
            margin-left: 0;
        }
      `}</style>
    </>
  );
};

export default FormNew2;