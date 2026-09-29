import { SubscriptionTier } from '@prisma/client';
import prisma from '../services/db/prisma';

// 1. Define all possible features in your app
export type AppFeature = 'generate_report' | 'generate_book' | 'ai_quiz_agent';

// 2. Map tiers to what they are allowed to do
const TIER_ENTITLEMENTS: Record<SubscriptionTier, AppFeature[]> = {
    FREE: ['generate_report'],
    BOOK_ONLY: ['generate_report', 'generate_book'],
    PREMIUM: ['generate_report', 'generate_book', 'ai_quiz_agent'],
};

// 3. Create a single Guard Function
export async function verifySchoolAccess(sekolahId: number, feature: AppFeature) {
    const sekolah = await prisma.sekolah.findUnique({
        where: { id: sekolahId },
        select: { tier: true, aktifSampai: true, isRetired: true }
    });

    if (!sekolah || sekolah.isRetired) {
        throw new Error("School not found or inactive.");
    }

    // Optional: Check if subscription has expired
    if (sekolah.aktifSampai && new Date() > sekolah.aktifSampai) {
        throw new Error("Subscription expired. Please confirm payment.");
    }

    const allowedFeatures = TIER_ENTITLEMENTS[sekolah.tier];

    if (!allowedFeatures.includes(feature)) {
        throw new Error(`Access Denied: ${feature} requires an upgrade from ${sekolah.tier}.`);
    }

    return true;
}