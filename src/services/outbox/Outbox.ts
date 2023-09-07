export class OutboxService {
  constructor() {
    console.info('This is the user service!');
  }

  publish() {
    return 'Published Outbox!';
  }
}
