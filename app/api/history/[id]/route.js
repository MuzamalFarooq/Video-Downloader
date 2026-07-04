import { NextResponse } from 'next/server';
import { deleteHistory, toggleFavorite } from '@/services/historyService';

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const result = await toggleFavorite(id);
    
    if (!result) {
      return NextResponse.json({ error: 'History record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, item: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to toggle favorite' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const success = await deleteHistory(id);
    
    if (!success) {
      return NextResponse.json({ error: 'History record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete record' }, 
      { status: 500 }
    );
  }
}
