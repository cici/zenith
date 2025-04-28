import { configureStore } from '@reduxjs/toolkit';

// Example placeholder reducer
const placeholderReducer = (state = {}, action: any) => state;

export const store = configureStore({
  reducer: {
    placeholder: placeholderReducer,
    // Add your feature slices here
  },
});

// Types for use in hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 