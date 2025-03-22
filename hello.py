def calculator():
    x, op, y = input("Enter calculation (e.g., 2 + 2): ").split()
    x, y = float(x), float(y)
    operations = {'+': x + y, '-': x - y, '*': x * y, '/': x / y if y != 0 else "Error! Division by zero."}
    print("Result:", operations.get(op, "Invalid operation"))

if __name__ == "__main__":
    calculator()