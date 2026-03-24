import { getServerLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | osocios.club",
};

export default async function PrivacyPolicyPage() {
  const locale = await getServerLocale();

  if (locale === "es") {
    return <PrivacyES />;
  }
  return <PrivacyEN />;
}

function PrivacyEN() {
  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-gray-500">Last updated: March 17, 2026</p>

      <h2>1. Data Controller</h2>
      <p>
        osocios.club (&quot;we&quot;, &quot;us&quot;, &quot;the Platform&quot;) is operated by Osocios S.R.L, with
        registered address in Barcelona, Spain. For privacy inquiries, contact us at{" "}
        <a href="mailto:privacy@osocios.club">privacy@osocios.club</a>.
      </p>

      <h2>2. What Data We Collect</h2>

      <h3>2.1 Club Visitors (Invite Requests)</h3>
      <p>When you request an invite to a club, we collect:</p>
      <ul>
        <li>Your name</li>
        <li>Your contact information (email or phone, as you provide)</li>
        <li>Optional message</li>
        <li>Timestamp of your consent to this policy</li>
      </ul>

      <h3>2.2 Club Members</h3>
      <p>When a club creates your member account, the following is stored:</p>
      <ul>
        <li>Member code (your unique identifier)</li>
        <li>Full name (if provided by the club)</li>
        <li>PIN hash (for staff accounts only — we never store your PIN in plain text)</li>
        <li>Membership status and expiry date</li>
        <li>Activity data: spin history, quest completions, event RSVPs and check-ins, badge achievements</li>
      </ul>

      <h3>2.3 Club Owners (Administrators)</h3>
      <ul>
        <li>Email address</li>
        <li>Password (stored as a secure hash, never in plain text)</li>
      </ul>

      <h3>2.4 Cookies</h3>
      <p>We use the following cookies:</p>
      <ul>
        <li><strong>clubos-member-token</strong> — Authentication session (7 days, essential)</li>
        <li><strong>clubos-staff-token</strong> — Staff authentication session (12 hours, essential)</li>
        <li><strong>clubos-owner-token</strong> — Admin authentication session (24 hours, essential)</li>
        <li><strong>clubos-lang</strong> — Language preference (30 days, functional)</li>
      </ul>
      <p>All cookies are HttpOnly, Secure, and SameSite=Lax. We do not use tracking or advertising cookies.</p>

      <h3>2.5 Uploaded Content</h3>
      <p>Club administrators may upload images (logos, event photos, gallery images). Members may upload proof images for quest completion when required by the club.</p>

      <h2>3. Legal Basis for Processing</h2>
      <ul>
        <li><strong>Consent</strong> — For invite requests and voluntary data submissions</li>
        <li><strong>Legitimate interest</strong> — For member account management by club administrators</li>
        <li><strong>Contract performance</strong> — For club owner accounts and platform services</li>
      </ul>

      <h2>4. How We Use Your Data</h2>
      <ul>
        <li>To authenticate you and manage your sessions</li>
        <li>To enable club features (events, quests, rewards, badges)</li>
        <li>To process invite requests on behalf of clubs</li>
        <li>To send password reset emails (club owners only)</li>
        <li>To maintain audit logs of administrative actions</li>
      </ul>

      <h2>5. Data Processors (Third Parties)</h2>
      <table>
        <thead>
          <tr><th>Processor</th><th>Purpose</th><th>Location</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase</td><td>Database and file storage</td><td>EU (eu-west-1)</td></tr>
          <tr><td>Vercel</td><td>Web hosting and deployment</td><td>EU</td></tr>
          <tr><td>Resend</td><td>Transactional email (password resets)</td><td>US</td></tr>
          <tr><td>Telegram</td><td>Staff notifications (only if configured by club)</td><td>Global</td></tr>
        </tbody>
      </table>

      <h2>6. Data Retention</h2>
      <ul>
        <li>Member accounts are kept while the club is active. Deletion available upon request.</li>
        <li>Invite requests are kept until reviewed by the club administrator.</li>
        <li>Password reset tokens expire after 1 hour.</li>
        <li>Activity logs and spin history are retained for the lifetime of the club.</li>
        <li>Authentication cookies expire as noted above.</li>
      </ul>

      <h2>7. Your Rights (GDPR)</h2>
      <p>Under the General Data Protection Regulation, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> — Request a copy of your personal data</li>
        <li><strong>Rectification</strong> — Correct inaccurate data</li>
        <li><strong>Erasure</strong> — Request deletion of your data (&quot;right to be forgotten&quot;)</li>
        <li><strong>Data portability</strong> — Receive your data in a structured format</li>
        <li><strong>Object</strong> — Object to processing based on legitimate interest</li>
        <li><strong>Withdraw consent</strong> — Withdraw consent at any time for consent-based processing</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:privacy@osocios.club">privacy@osocios.club</a>.
      </p>

      <h2>8. Supervisory Authority</h2>
      <p>
        You have the right to lodge a complaint with the Spanish Data Protection Agency (AEPD) at{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this privacy policy from time to time. The &quot;last updated&quot; date at the top reflects
        the most recent revision. Continued use of the platform after changes constitutes acceptance.
      </p>
    </article>
  );
}

function PrivacyES() {
  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>Pol&iacute;tica de Privacidad</h1>
      <p className="text-gray-500">&Uacute;ltima actualizaci&oacute;n: 17 de marzo de 2026</p>

      <h2>1. Responsable del Tratamiento</h2>
      <p>
        osocios.club (&quot;nosotros&quot;, &quot;la Plataforma&quot;) es operado por Osocios S.R.L, con
        domicilio social en Barcelona, Espa&ntilde;a. Para consultas de privacidad, cont&aacute;ctenos en{" "}
        <a href="mailto:privacy@osocios.club">privacy@osocios.club</a>.
      </p>

      <h2>2. Qu&eacute; Datos Recopilamos</h2>

      <h3>2.1 Visitantes del Club (Solicitudes de Invitaci&oacute;n)</h3>
      <p>Cuando solicitas una invitaci&oacute;n a un club, recopilamos:</p>
      <ul>
        <li>Tu nombre</li>
        <li>Tu informaci&oacute;n de contacto (email o tel&eacute;fono, seg&uacute;n proporciones)</li>
        <li>Mensaje opcional</li>
        <li>Marca de tiempo de tu consentimiento a esta pol&iacute;tica</li>
      </ul>

      <h3>2.2 Miembros del Club</h3>
      <p>Cuando un club crea tu cuenta de miembro, se almacena:</p>
      <ul>
        <li>C&oacute;digo de miembro (tu identificador &uacute;nico)</li>
        <li>Nombre completo (si lo proporciona el club)</li>
        <li>Hash del PIN (solo para cuentas de staff — nunca almacenamos tu PIN en texto plano)</li>
        <li>Estado de membres&iacute;a y fecha de vencimiento</li>
        <li>Datos de actividad: historial de tiradas, misiones completadas, RSVPs y asistencia a eventos, insignias</li>
      </ul>

      <h3>2.3 Propietarios del Club (Administradores)</h3>
      <ul>
        <li>Direcci&oacute;n de email</li>
        <li>Contrase&ntilde;a (almacenada como hash seguro, nunca en texto plano)</li>
      </ul>

      <h3>2.4 Cookies</h3>
      <p>Utilizamos las siguientes cookies:</p>
      <ul>
        <li><strong>clubos-member-token</strong> — Sesi&oacute;n de autenticaci&oacute;n (7 d&iacute;as, esencial)</li>
        <li><strong>clubos-staff-token</strong> — Sesi&oacute;n de autenticaci&oacute;n de staff (12 horas, esencial)</li>
        <li><strong>clubos-owner-token</strong> — Sesi&oacute;n de administraci&oacute;n (24 horas, esencial)</li>
        <li><strong>clubos-lang</strong> — Preferencia de idioma (30 d&iacute;as, funcional)</li>
      </ul>
      <p>Todas las cookies son HttpOnly, Secure y SameSite=Lax. No utilizamos cookies de seguimiento ni publicidad.</p>

      <h3>2.5 Contenido Subido</h3>
      <p>Los administradores del club pueden subir im&aacute;genes (logos, fotos de eventos, galer&iacute;a). Los miembros pueden subir im&aacute;genes como prueba de completar misiones cuando el club lo requiera.</p>

      <h2>3. Base Legal del Tratamiento</h2>
      <ul>
        <li><strong>Consentimiento</strong> — Para solicitudes de invitaci&oacute;n y env&iacute;os voluntarios de datos</li>
        <li><strong>Inter&eacute;s leg&iacute;timo</strong> — Para la gesti&oacute;n de cuentas de miembros por parte de los administradores del club</li>
        <li><strong>Ejecuci&oacute;n contractual</strong> — Para cuentas de propietarios de club y servicios de la plataforma</li>
      </ul>

      <h2>4. C&oacute;mo Usamos tus Datos</h2>
      <ul>
        <li>Para autenticarte y gestionar tus sesiones</li>
        <li>Para habilitar funciones del club (eventos, misiones, recompensas, insignias)</li>
        <li>Para procesar solicitudes de invitaci&oacute;n en nombre de los clubes</li>
        <li>Para enviar emails de restablecimiento de contrase&ntilde;a (solo propietarios de club)</li>
        <li>Para mantener registros de auditor&iacute;a de acciones administrativas</li>
      </ul>

      <h2>5. Encargados del Tratamiento (Terceros)</h2>
      <table>
        <thead>
          <tr><th>Proveedor</th><th>Finalidad</th><th>Ubicaci&oacute;n</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase</td><td>Base de datos y almacenamiento de archivos</td><td>UE (eu-west-1)</td></tr>
          <tr><td>Vercel</td><td>Alojamiento web y despliegue</td><td>UE</td></tr>
          <tr><td>Resend</td><td>Email transaccional (restablecimiento de contrase&ntilde;as)</td><td>EE.UU.</td></tr>
          <tr><td>Telegram</td><td>Notificaciones al staff (solo si el club lo configura)</td><td>Global</td></tr>
        </tbody>
      </table>

      <h2>6. Retenci&oacute;n de Datos</h2>
      <ul>
        <li>Las cuentas de miembros se mantienen mientras el club est&eacute; activo. Eliminaci&oacute;n disponible bajo solicitud.</li>
        <li>Las solicitudes de invitaci&oacute;n se mantienen hasta que el administrador del club las revise.</li>
        <li>Los tokens de restablecimiento de contrase&ntilde;a caducan despu&eacute;s de 1 hora.</li>
        <li>Los registros de actividad y el historial de tiradas se conservan durante la vida del club.</li>
        <li>Las cookies de autenticaci&oacute;n caducan seg&uacute;n lo indicado anteriormente.</li>
      </ul>

      <h2>7. Tus Derechos (RGPD)</h2>
      <p>Seg&uacute;n el Reglamento General de Protecci&oacute;n de Datos, tienes derecho a:</p>
      <ul>
        <li><strong>Acceso</strong> — Solicitar una copia de tus datos personales</li>
        <li><strong>Rectificaci&oacute;n</strong> — Corregir datos inexactos</li>
        <li><strong>Supresi&oacute;n</strong> — Solicitar la eliminaci&oacute;n de tus datos (&quot;derecho al olvido&quot;)</li>
        <li><strong>Portabilidad</strong> — Recibir tus datos en un formato estructurado</li>
        <li><strong>Oposici&oacute;n</strong> — Oponerte al tratamiento basado en inter&eacute;s leg&iacute;timo</li>
        <li><strong>Retirar consentimiento</strong> — Retirar tu consentimiento en cualquier momento</li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, cont&aacute;ctanos en{" "}
        <a href="mailto:privacy@osocios.club">privacy@osocios.club</a>.
      </p>

      <h2>8. Autoridad de Control</h2>
      <p>
        Tienes derecho a presentar una reclamaci&oacute;n ante la Agencia Espa&ntilde;ola de Protecci&oacute;n de Datos (AEPD) en{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
      </p>

      <h2>9. Cambios en esta Pol&iacute;tica</h2>
      <p>
        Podemos actualizar esta pol&iacute;tica de privacidad peri&oacute;dicamente. La fecha de &quot;&uacute;ltima actualizaci&oacute;n&quot; en la parte
        superior refleja la revisi&oacute;n m&aacute;s reciente. El uso continuado de la plataforma despu&eacute;s de los cambios constituye aceptaci&oacute;n.
      </p>
    </article>
  );
}
