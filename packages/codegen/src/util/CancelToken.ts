export default class CancelToken {
  public cancelled = false;
  public onCancel?: () => void;
  public cancel() {
    this.cancelled = true;
    this.onCancel && this.onCancel();
  }
}
