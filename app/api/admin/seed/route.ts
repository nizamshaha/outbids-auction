import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { scrapeUrlMetadata } from '@/utils/metadata';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, amountInDollars = 5, category = 'Other', title, description } = body;

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 });
    }

    const urlCheck = sanitizeAndNormalizeUrl(url);
    if (!urlCheck.isValid) {
      return NextResponse.json({ error: urlCheck.error || 'Invalid URL format.' }, { status: 400 });
    }

    const normalizedUrl = urlCheck.normalizedUrl;
    const displayDomain = urlCheck.displayDomain;
    const amountCents = Math.max(0, Math.round(parseFloat(amountInDollars) * 100));

    // Scrape metadata if title or description were left blank
    const scraped = await scrapeUrlMetadata(normalizedUrl);
    const finalTitle = title?.trim() || scraped.title || displayDomain;
    const finalDescription = description?.trim() || scraped.description;
    const finalIconUrl = scraped.iconUrl;

    const supabase = createAdminClient();

    // Check if URL already exists
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id')
      .eq('url', normalizedUrl)
      .limit(1)
      .maybeSingle();

    if (existingBid) {
      // Update existing bid to paid status & new amount
      const { data: updated, error: updateError } = await supabase
        .from('bids')
        .update({
          amount: amountCents,
          status: 'paid',
          category,
          title: finalTitle,
          description: finalDescription,
          icon_url: finalIconUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBid.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        bid: updated,
        message: `Successfully updated listing for ${displayDomain} at $${amountInDollars}!`,
      });
    }

    // Insert new paid seeded bid
    const { data: newBid, error: insertError } = await supabase
      .from('bids')
      .insert({
        url: normalizedUrl,
        amount: amountCents,
        status: 'paid',
        category,
        title: finalTitle,
        description: finalDescription,
        icon_url: finalIconUrl,
        click_count: 0,
        view_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      // Fallback insert if rich columns are not in schema
      const fallback = await supabase
        .from('bids')
        .insert({
          url: normalizedUrl,
          amount: amountCents,
          status: 'paid',
          title: finalTitle,
          description: finalDescription,
        })
        .select()
        .single();

      if (fallback.error) {
        throw fallback.error;
      }

      return NextResponse.json({
        success: true,
        action: 'created_fallback',
        bid: fallback.data,
        message: `Successfully seeded ${displayDomain} for $${amountInDollars}!`,
      });
    }

    return NextResponse.json({
      success: true,
      action: 'created',
      bid: newBid,
      message: `Successfully seeded ${displayDomain} for $${amountInDollars}!`,
    });
  } catch (err: any) {
    console.error('[Admin Seed Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to seed listing.' }, { status: 500 });
  }
}
