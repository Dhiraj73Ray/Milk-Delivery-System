def add(num1, num2):
    try:
        if num1 % 2 == 0 and num2 % 2 == 0:
            sum = num1 + num2
        else:
            sum = 0
        yield sum
    finally:
        print("addition done")


result = add(6,6)
print(next(result))