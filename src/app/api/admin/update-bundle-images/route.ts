import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Updating bundle images...');

    // Update Duo Pack
    const { error: duoError } = await supabase
      .from('products')
      .update({ images: ['/images/bundles/duo-pack.svg'] })
      .eq('sku', 'BUNDLE-2PACK');

    if (duoError) {
      console.error('Error updating Duo Pack:', duoError.message);
      throw duoError;
    }

    // Update Trio Pack
    const { error: trioError } = await supabase
      .from('products')
      .update({ images: ['/images/bundles/trio-pack.svg'] })
      .eq('sku', 'BUNDLE-3PACK');

    if (trioError) {
      console.error('Error updating Trio Pack:', trioError.message);
      throw trioError;
    }

    // Update Mini Kit
    const { error: kitError } = await supabase
      .from('products')
      .update({ images: ['/images/bundles/mini-kit.svg'] })
      .eq('sku', 'BUNDLE-4PACK');

    if (kitError) {
      console.error('Error updating Mini Kit:', kitError.message);
      throw kitError;
    }

    // Verify updates
    const { data: bundles, error: verifyError } = await supabase
      .from('products')
      .select('name, sku, images')
      .eq('category', 'bundles')
      .order('price');

    if (verifyError) {
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
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
