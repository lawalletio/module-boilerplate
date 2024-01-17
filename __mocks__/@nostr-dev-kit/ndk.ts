export const mockEventPublish = jest.fn();
export const NDKEvent = jest.fn().mockImplementation(() => {
  return {
    publish: mockEventPublish,
  }
});
