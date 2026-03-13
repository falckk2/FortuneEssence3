import '@/config/di-init';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updates = [
      { sku: 'BUNDLE-2PACK', image: '/images/bundles/duo-pack.svg', name: 'Duo Pack' },
      { sku: 'BUNDLE-3PACK', image: '/images/bundles/trio-pack.svg', name: 'Trio Pack' },
      { sku: 'BUNDLE-4PACK', image: '/images/bundles/mini-kit.svg', name: 'Mini Kit' },
    ];

    for (const { sku, image, name } of updates) {
      const { data, error } = await supabase
        .from('products')
        .update({ images: [image] })
        .eq('sku', sku)
        .select('sku');

      if (error) {
        console.error(`Error updating ${name}:`, error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error(`SKU not found: ${sku}`);
        return NextResponse.json(
          { success: false, error: 'Bundle SKU not found' },
          { status: 404 }
        );
      }
    }

    const { data: bundles, error: verifyError } = await supabase
      .from('products')
      .select('name, sku, images')
      .eq('category', 'bundles')
      .order('price');

    if (verifyError) {
      console.error('Error verifying bundle images:', verifyError.message);
      throw verifyError;
    }

    return NextResponse.json({
      success: true,
      message: 'Bundle images updated successfully',
      data: bundles,
    });
  } catch (error) {
    console.error('Error updating bundle images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
