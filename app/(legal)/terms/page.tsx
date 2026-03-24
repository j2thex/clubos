import { getServerLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | osocios.club",
};

export default async function TermsOfUsePage() {
  const locale = await getServerLocale();

  if (locale === "es") {
    return <TermsES />;
  }
  return <TermsEN />;
}

function TermsEN() {
  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>Terms of Use</h1>
      <p className="text-gray-500">Last updated: March 17, 2026</p>

      <h2>1. About the Service</h2>
      <p>
        osocios.club (&quot;the Platform&quot;) is a multi-tenant club management platform operated by
        Osocios S.R.L, Barcelona, Spain. The Platform provides tools for clubs to manage memberships,
        events, quests, rewards, and communications with their members.
      </p>

      <h2>2. User Roles</h2>
      <ul>
        <li><strong>Club Owners</strong> — Create and administer clubs through the admin panel. Responsible for their club&apos;s content and member data.</li>
        <li><strong>Staff Members</strong> — Manage day-to-day club operations (check-ins, quest verification, spin wheel). Designated by club owners.</li>
        <li><strong>Members</strong> — Access their club&apos;s member portal to participate in events, complete quests, earn rewards, and spin the prize wheel.</li>
        <li><strong>Visitors</strong> — View public club profiles and submit invite requests for invite-only clubs.</li>
      </ul>

      <h2>3. Account Terms</h2>
      <ul>
        <li>Club owner accounts are created during the onboarding process with an email and password.</li>
        <li>Member and staff accounts are created by club administrators. Members authenticate using a member code provided by their club.</li>
        <li>You are responsible for maintaining the security of your credentials.</li>
        <li>You must not share your member code, PIN, or admin password with unauthorized individuals.</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Platform for any illegal purpose or in violation of applicable laws</li>
        <li>Upload harmful, offensive, or illegal content</li>
        <li>Attempt to gain unauthorized access to other accounts or club data</li>
        <li>Interfere with or disrupt the Platform&apos;s infrastructure</li>
        <li>Scrape, crawl, or otherwise extract data from the Platform without permission</li>
        <li>Use the Platform to send spam or unsolicited communications</li>
      </ul>

      <h2>5. Content Ownership</h2>
      <ul>
        <li>The Platform (code, design, branding) is owned by Osocios S.R.L.</li>
        <li>Content created by club owners (events, quests, images, branding) remains the property of the respective club.</li>
        <li>By uploading content, you grant us a license to host and display it as part of the Platform&apos;s functionality.</li>
      </ul>

      <h2>6. Data Protection</h2>
      <p>
        Your personal data is handled in accordance with our{" "}
        <a href="/privacy">Privacy Policy</a>, which forms part of these Terms. Club owners act as
        data controllers for their members&apos; data, and we act as a data processor on their behalf.
      </p>

      <h2>7. Service Availability</h2>
      <p>
        We strive to maintain high availability but do not guarantee uninterrupted service. We may
        perform maintenance, updates, or modifications to the Platform at any time. We will make
        reasonable efforts to notify users of significant planned downtime.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Osocios S.R.L shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages resulting from your use of or inability
        to use the Platform. Our total liability shall not exceed the amount paid by you (if any) in
        the 12 months preceding the claim.
      </p>

      <h2>9. Termination</h2>
      <ul>
        <li>Club owners may delete their club at any time by contacting us.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
        <li>Upon termination, club data will be retained for 30 days before permanent deletion, unless otherwise required by law.</li>
      </ul>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of Spain. Any disputes shall be submitted to the courts
        of Barcelona, Spain, without prejudice to your rights under EU consumer protection regulations.
      </p>

      <h2>11. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. The &quot;last updated&quot; date at the top reflects the
        most recent revision. Continued use of the Platform after changes constitutes acceptance of
        the revised Terms.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions about these Terms, contact us at{" "}
        <a href="mailto:hello@osocios.club">hello@osocios.club</a>.
      </p>
    </article>
  );
}

function TermsES() {
  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>Condiciones de Uso</h1>
      <p className="text-gray-500">&Uacute;ltima actualizaci&oacute;n: 17 de marzo de 2026</p>

      <h2>1. Sobre el Servicio</h2>
      <p>
        osocios.club (&quot;la Plataforma&quot;) es una plataforma de gesti&oacute;n de clubes multi-tenant operada por
        Osocios S.R.L, Barcelona, Espa&ntilde;a. La Plataforma proporciona herramientas para que los clubes gestionen
        membres&iacute;as, eventos, misiones, recompensas y comunicaciones con sus miembros.
      </p>

      <h2>2. Roles de Usuario</h2>
      <ul>
        <li><strong>Propietarios de Club</strong> — Crean y administran clubes a trav&eacute;s del panel de administraci&oacute;n. Responsables del contenido y datos de miembros de su club.</li>
        <li><strong>Personal (Staff)</strong> — Gestionan las operaciones diarias del club (check-ins, verificaci&oacute;n de misiones, ruleta de premios). Designados por los propietarios.</li>
        <li><strong>Miembros</strong> — Acceden al portal de miembros de su club para participar en eventos, completar misiones, ganar recompensas y girar la ruleta.</li>
        <li><strong>Visitantes</strong> — Ven perfiles p&uacute;blicos de clubes y env&iacute;an solicitudes de invitaci&oacute;n para clubes con acceso por invitaci&oacute;n.</li>
      </ul>

      <h2>3. T&eacute;rminos de Cuenta</h2>
      <ul>
        <li>Las cuentas de propietario se crean durante el proceso de registro con email y contrase&ntilde;a.</li>
        <li>Las cuentas de miembros y staff son creadas por los administradores del club. Los miembros se autentican con un c&oacute;digo proporcionado por su club.</li>
        <li>Eres responsable de mantener la seguridad de tus credenciales.</li>
        <li>No debes compartir tu c&oacute;digo de miembro, PIN o contrase&ntilde;a de administrador con personas no autorizadas.</li>
      </ul>

      <h2>4. Uso Aceptable</h2>
      <p>Te comprometes a no:</p>
      <ul>
        <li>Usar la Plataforma para fines ilegales o en violaci&oacute;n de las leyes aplicables</li>
        <li>Subir contenido da&ntilde;ino, ofensivo o ilegal</li>
        <li>Intentar acceder sin autorizaci&oacute;n a otras cuentas o datos de clubes</li>
        <li>Interferir con o interrumpir la infraestructura de la Plataforma</li>
        <li>Extraer datos de la Plataforma sin permiso</li>
        <li>Usar la Plataforma para enviar spam o comunicaciones no solicitadas</li>
      </ul>

      <h2>5. Propiedad del Contenido</h2>
      <ul>
        <li>La Plataforma (c&oacute;digo, dise&ntilde;o, marca) es propiedad de Osocios S.R.L.</li>
        <li>El contenido creado por los propietarios de clubes (eventos, misiones, im&aacute;genes, marca) sigue siendo propiedad del club respectivo.</li>
        <li>Al subir contenido, nos otorgas una licencia para alojarlo y mostrarlo como parte de la funcionalidad de la Plataforma.</li>
      </ul>

      <h2>6. Protecci&oacute;n de Datos</h2>
      <p>
        Tus datos personales se tratan de acuerdo con nuestra{" "}
        <a href="/privacy">Pol&iacute;tica de Privacidad</a>, que forma parte de estas Condiciones. Los propietarios
        de clubes act&uacute;an como responsables del tratamiento de los datos de sus miembros, y nosotros actuamos
        como encargados del tratamiento en su nombre.
      </p>

      <h2>7. Disponibilidad del Servicio</h2>
      <p>
        Nos esforzamos por mantener una alta disponibilidad pero no garantizamos un servicio ininterrumpido.
        Podemos realizar mantenimientos, actualizaciones o modificaciones en la Plataforma en cualquier momento.
        Haremos esfuerzos razonables para notificar a los usuarios sobre tiempos de inactividad planificados significativos.
      </p>

      <h2>8. Limitaci&oacute;n de Responsabilidad</h2>
      <p>
        En la m&aacute;xima medida permitida por la ley, Osocios S.R.L no ser&aacute; responsable de ning&uacute;n da&ntilde;o indirecto,
        incidental, especial, consecuente o punitivo derivado de tu uso o imposibilidad de uso de la Plataforma.
        Nuestra responsabilidad total no exceder&aacute; la cantidad pagada por ti (si corresponde) en los 12 meses
        anteriores a la reclamaci&oacute;n.
      </p>

      <h2>9. Terminaci&oacute;n</h2>
      <ul>
        <li>Los propietarios de clubes pueden eliminar su club en cualquier momento contact&aacute;ndonos.</li>
        <li>Nos reservamos el derecho de suspender o terminar cuentas que violen estas Condiciones.</li>
        <li>Tras la terminaci&oacute;n, los datos del club se conservar&aacute;n durante 30 d&iacute;as antes de la eliminaci&oacute;n permanente, salvo que la ley exija lo contrario.</li>
      </ul>

      <h2>10. Ley Aplicable</h2>
      <p>
        Estas Condiciones se rigen por las leyes de Espa&ntilde;a. Cualquier disputa se someter&aacute; a los tribunales
        de Barcelona, Espa&ntilde;a, sin perjuicio de tus derechos bajo la normativa europea de protecci&oacute;n al consumidor.
      </p>

      <h2>11. Cambios en estas Condiciones</h2>
      <p>
        Podemos actualizar estas Condiciones peri&oacute;dicamente. La fecha de &quot;&uacute;ltima actualizaci&oacute;n&quot; en la parte
        superior refleja la revisi&oacute;n m&aacute;s reciente. El uso continuado de la Plataforma despu&eacute;s de los cambios
        constituye aceptaci&oacute;n de las Condiciones revisadas.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para preguntas sobre estas Condiciones, cont&aacute;ctanos en{" "}
        <a href="mailto:hello@osocios.club">hello@osocios.club</a>.
      </p>
    </article>
  );
}
