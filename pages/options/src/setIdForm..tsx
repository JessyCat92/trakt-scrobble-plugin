import { withErrorBoundary, withSuspense } from '@extension/shared/dist/lib/hoc';
import { itemQueueStorage } from '@extension/storage/dist/lib';
import { Button, ErrorDisplay, LoadingSpinner } from '@extension/ui/dist/lib';
import React, { useState } from 'react';

type SetIdFormProps = {
  className?: string;
  children?: React.ReactNode;
  itemId: string;
};

const updateItem = async (id: number | undefined, itemId: string) => {
  if (!id) return;
  const item = await itemQueueStorage.getItembyUniqueId(itemId);
  item.tmdbId = id;
  await itemQueueStorage.updateItem(item);
};

const SetIdForm = ({ className, children, ...props }: SetIdFormProps) => {
  const [newId, setNewId] = useState<number>();
  console.log('props', props.itemId);
  console.log('newId', newId);

  return (
    <>
      <input
        type="number"
        style={{ width: '90px', height: '1.7em', fontSize: '0.75em', color: 'black' }}
        placeholder="tmdbId"
        value={newId}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewId(parseInt(e.target.value))}
      />
      <Button style={{ fontSize: '0.75em', margin: 0, padding: '2px' }} onClick={() => updateItem(newId, props.itemId)}>
        SetId
      </Button>
    </>
  );
};

export default withErrorBoundary(withSuspense(SetIdForm, <LoadingSpinner />), ErrorDisplay);
