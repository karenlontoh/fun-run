import "server-only";
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { generateQrDataUrl } from "./qrcode";
import { verifyUrl } from "./site";
import { formatIDR } from "./pricing";
import { EVENT } from "./event-config";
import type { Participant, Registration } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: "#002560",
    fontFamily: "Helvetica",
  },
  kicker: {
    fontSize: 9,
    color: "#FE572A",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#00256022",
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 9,
    color: "#00256099",
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  participantLine: {
    fontSize: 11,
    marginTop: 4,
  },
  qrWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrCaption: {
    marginTop: 8,
    fontSize: 9,
    color: "#00256099",
    textAlign: "center",
  },
  footer: {
    marginTop: 24,
    fontSize: 9,
    color: "#00256080",
  },
});

export async function generateRegistrationPdf(
  registration: Registration,
  participants: Participant[]
): Promise<Buffer> {
  const orderQr = await generateQrDataUrl(verifyUrl(registration.id));
  const personalQrs = await Promise.all(
    participants.map((p) => generateQrDataUrl(verifyUrl(p.id)))
  );

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>{EVENT.church.toUpperCase()}</Text>
        <Text style={styles.title}>{EVENT.name} — Registration Confirmation</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Registered By</Text>
          <Text style={styles.sectionValue}>{registration.contact_name}</Text>
          <Text style={styles.participantLine}>{registration.contact_email}</Text>
          <Text style={styles.participantLine}>{registration.contact_phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Participants ({participants.length})</Text>
          {participants.map((p) => (
            <Text key={p.id} style={styles.participantLine}>
              {p.full_name} — {p.category}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Total Payment</Text>
          </View>
          <Text style={styles.sectionValue}>{formatIDR(registration.total_amount)}</Text>
        </View>

        <View style={styles.qrWrap}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={orderQr} style={styles.qrImage} />
          <Text style={styles.qrCaption}>
            GROUP QR — show this at check-in if your group is arriving together. Scanning it
            reveals every participant in this registration.
          </Text>
        </View>

        <Text style={styles.footer}>
          Registration ID: {registration.id}. Individual QR codes for each participant follow on
          the next pages — useful if your group checks in separately.
        </Text>
      </Page>

      {participants.map((p, i) => (
        <Page key={p.id} size="A4" style={styles.page}>
          <Text style={styles.kicker}>{EVENT.church.toUpperCase()}</Text>
          <Text style={styles.title}>{p.full_name}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <Text style={styles.sectionValue}>{p.category}</Text>
            <View style={styles.row}>
              <View>
                <Text style={styles.sectionLabel}>Gender</Text>
                <Text style={styles.participantLine}>{p.gender === "L" ? "Male" : "Female"}</Text>
              </View>
              <View>
                <Text style={styles.sectionLabel}>Jersey Size</Text>
                <Text style={styles.participantLine}>{p.jersey_size}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Part of Group Registered By</Text>
            <Text style={styles.participantLine}>{registration.contact_name}</Text>
          </View>

          <View style={styles.qrWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={personalQrs[i]} style={styles.qrImage} />
            <Text style={styles.qrCaption}>
              PERSONAL QR — show this at check-in to collect your own race pack.
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );

  return renderToBuffer(doc);
}
