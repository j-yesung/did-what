type RecordPage<T> = {
  nextCursor: unknown;
  records: T[];
};

export const reverseRecordPages = <T>(pages: readonly RecordPage<T>[]) => {
  return {
    pageParams: [null],
    pages: [
      {
        nextCursor: null,
        records: pages.flatMap((page) => page.records).toReversed(),
      },
    ],
  };
};
