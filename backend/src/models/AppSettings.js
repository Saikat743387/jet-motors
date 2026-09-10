import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

export const COMMISSION_RATES = { 1: 0.22, 2: 0.02, 3: 0.01 };

export async function getSettings() {
  const rows = await AppSettings.find();
  const map = {
    appName: 'JET MOTORS',
    minWithdrawal: 100,
    supportPhone: '',
    supportEmail: 'support@jetmotors.local',
    aboutText:
      'JET MOTORS offers curated automotive service plans. Returns shown are plan features of a service product, not guaranteed investment yields. Verify applicable laws before operating with real money.',
    commissionRates: COMMISSION_RATES,
    inviteRequired: false,
  };
  for (const row of rows) map[row.key] = row.value;
  return map;
}
