export const Validators = {
  required(value: string): string | boolean {
    if (value) {
      return true
    }
    return 'This field is required!'
  }
}
