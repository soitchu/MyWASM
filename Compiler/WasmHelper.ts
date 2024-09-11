import { DataType, Token, TokenType } from "./types";
import * as ast from "./types";

export const BUILT_INS = [
  "print",
  "input",
  "itos",
  "itod",
  "dtos",
  "dtoi",
  "stoi",
  "stod",
  "length",
  "get",
  "allocate_memory",
  "mem_copy",
  "get_array_pointer",
  "array_int_to_string",
  "string_to_array_int",
  "error",
  "deallocate_memory",
  "delete_i32_array",
  "i32_load",
  "i32_store",
  "delete_struct",
  "sleep",
  "random",
  "length_string",
  "string_print",
  "string_append",
  "string_compare"
];

const token_to_op: { [key: number]: string | Object } = {};
token_to_op[TokenType.PLUS] = ".add";
token_to_op[TokenType.MINUS] = ".sub";
token_to_op[TokenType.TIMES] = ".mul";
token_to_op[TokenType.DIVIDE] = {
  i32: ".div_s",
  f64: ".div",
};

token_to_op[TokenType.EQUAL] = ".eq";
token_to_op[TokenType.LESS_EQ] = {
  i32: ".le_s",
  f64: ".le",
};

token_to_op[TokenType.LESS] = {
  i32: ".lt_s",
  f64: ".lt",
};

token_to_op[TokenType.GREATER_EQ] = {
  i32: ".ge_s",
  f64: ".ge",
};

token_to_op[TokenType.GREATER] = {
  i32: ".gt_s",
  f64: ".gt",
};

token_to_op[TokenType.AND] = ".and";
token_to_op[TokenType.NOT_EQUAL] = ".ne";
token_to_op[TokenType.OR] = ".or";
token_to_op[TokenType.MOD] = {
  i32: ".rem_s",
};

const mapped_functions = {
  mem_copy: "memory.copy",
  i32_load: "i32.load",
  i32_store: "i32.store",
};

export function getMappedFunctions(name: string) {
  if (name in mapped_functions) {
    return mapped_functions[name];
  }
  return undefined;
}

export function getPrintFunction(data_type: DataType, isCoreCode: boolean = false) {
  //   # print(data_type)
  //   # print(data_type.type_name == TokenType.BOOL_TYPE)
  const type_name = data_type.type_name.token_type;
  if(isCoreCode) return "print";

  if (data_type.is_array) {
    return "print_int";
  } else if ([TokenType.BOOL_TYPE, TokenType.BOOL_VAL].includes(type_name)) {
    return "print_bool";
  } else if ([TokenType.INT_TYPE, TokenType.INT_VAL].includes(type_name)) {
    return "print_int";
  } else if (
    [TokenType.DOUBLE_TYPE, TokenType.DOUBLE_VAL].includes(type_name)
  ) {
    return "print_double";
  } else if (
    [TokenType.STRING_TYPE, TokenType.STRING_VAL].includes(type_name)
  ) {
    return "string_print";
  }
}

export function getLengthFunction(data_type: DataType) {
  const type_name = data_type.type_name.token_type;

  if (data_type.is_array) {
    return "length";
  } else if (
    [TokenType.STRING_TYPE, TokenType.STRING_VAL].includes(type_name)
  ) {
    return "main_string_length";
  }

  return "length";
}

export function getWASMType(type_name: Token, is_array: boolean) {
  if (is_array) {
    return "i32";
  }

  if (
    [
      TokenType.ID,
      TokenType.VOID_TYPE,
      TokenType.NULL_VAL,
      TokenType.STRING_TYPE,
      TokenType.STRING_VAL,
    ].includes(type_name.token_type)
  ) {
    return "i32";
  }

  if (
    [TokenType.DOUBLE_TYPE, TokenType.DOUBLE_VAL].includes(type_name.token_type)
  ) {
    return "f64";
  }

  if (
    type_name.lexeme == "int" ||
    type_name.lexeme == "bool" ||
    type_name.token_type == TokenType.INT_VAL ||
    type_name.token_type == TokenType.BOOL_VAL
  ) {
    return "i32";
  }

  throw Error("Type not recognized");
}

export function getWASMSize(data_type: DataType) {
  if (
    [
      TokenType.INT_TYPE,
      TokenType.INT_VAL,
      TokenType.ID,
      TokenType.STRING_TYPE,
      TokenType.STRING_VAL,
      TokenType.BOOL_TYPE,
      TokenType.BOOL_VAL,
    ].includes(data_type.type_name.token_type)
  ) {
    return 4;
  }

  if (
    [TokenType.DOUBLE_TYPE, TokenType.DOUBLE_VAL].includes(
      data_type.type_name.token_type
    )
  ) {
    return 8;
  }

  throw new Error("Type not found");
}

export function getWASMValue(type_name: Token) {
  if (type_name.lexeme === "null") {
    return "0";
  }

  if (type_name.token_type === TokenType.BOOL_VAL) {
    if (type_name.lexeme === "true") {
      return "1";
    } else {
      return "0";
    }
  }

  return type_name.lexeme;
}

export function getWASMOp(op: Token, type_name: Token) {
  const tmpOp = token_to_op[op.token_type];

  if (typeof tmpOp == "string") {
    return tmpOp;
  } else {
    return tmpOp[getWASMType(type_name, false)];
  }
}

function generate_array_functions(
  size: number,
  wasm_type_name: string,
  unsafe: boolean = false
) {
  return `
  (func \$${wasm_type_name}_set_array_elem (param $value ${wasm_type_name}) (param $index i32) (param $arr i32) 
    ${
      unsafe
        ? ""
        : `
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds`
    }
    
    local.get $index
    i32.const ${size}
    i32.mul
    local.get $arr
    i32.add
    local.get $value
    ${wasm_type_name}.store
  )

  (func \$${wasm_type_name}_set_array_elem_alt (param $value ${wasm_type_name}) (param $arr i32) (param $index i32)   
    local.get $value
    local.get $index
    local.get $arr
    call \$${wasm_type_name}_set_array_elem
  )
  
  (func \$${wasm_type_name}_get_array_elem (param $index i32) (param $arr i32) (result ${wasm_type_name})
    ${
      unsafe
        ? ""
        : `
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds`
    }
    
    local.get $index
    i32.const ${size}
    i32.mul
    local.get $arr
    i32.add
    ${wasm_type_name}.load
    return
  )
  
  (func \$${wasm_type_name}_get_array_elem_alt (param $arr i32) (param $index i32) (result ${wasm_type_name})
    local.get $index
    local.get $arr
    call \$${wasm_type_name}_get_array_elem
  )
  
  (func \$${wasm_type_name}_new_array (param $size i32) (result i32)
   (local $index i32)
    local.get $size
    i32.const ${size}
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    i32.const 4
    i32.add
    local.set $index

    local.get $index
    i32.const 4
    i32.sub
    local.get $size
    i32.store

    local.get $index
    return
  )`;
}

function generate_struct_functions(size: number, wasm_type: string) {
  return `
  (func \$${wasm_type}_assign_to_struct (param $value ${wasm_type}) (param $struct i32) (param $index i32)
    local.get $struct
    call $check_if_null
    local.get $index
    i32.add

    local.get $value
    ${wasm_type}.store
  )`;
}

function generatePrintFunctions() {
  return `



  (func $print_string (param $print_string0_value i32)
    local.get $print_string0_value
    call $print
  )`;
}

function get_string_functions() {
  return `
  (func $string_ini (param $length i32) (result i32)
  (local $totalBytes i32)
  (local $tmpOffset i32)

  i32.const 4
  i32.const 4
  local.get $length
  i32.mul
  i32.add
  local.set $totalBytes

  local.get $totalBytes
  call $allocate_memory
  local.set $tmpOffset

  local.get $tmpOffset
  local.get $length
  i32.store

  local.get $tmpOffset
  i32.const 4
  i32.add
  
  return
)
  `;
}

export function getWASMCoreFunctions(unsafe = false) {
  return `(func $print (import "env" "print") (param i32))
  (func $input (import "env" "input") (result i32))
  (func $sleep (import "env" "sleep") (param i32))
  (func $random (import "env" "random") (result f64))
  (func $allocate_memory (import "env" "allocate_memory") (param i32) (result i32))
  (func $deallocate_memory (import "env" "deallocate_memory") (param i32) (param i32))
  (export "string_ini" (func $string_ini))
  (export "main_string_ini" (func $main_string_ini))
  (export "main_string_ini_unpooled" (func $main_string_ini_unpooled))
  (export "string_ini_assign" (func $string_ini_assign))
  (global $mem (mut i32) (i32.const 0))
  (global $tmp (mut i32) (i32.const 0))

  (func $check_in_bounds (param $arr i32) (param $index i32)
    local.get $index
    i32.const 0
    i32.lt_s
    local.get $index
    local.get $arr
    call $length
    i32.ge_s
    i32.or
    if
      unreachable
    end
  )
  
  
  (func $check_if_null (param $struct i32) (result i32)
    local.get $struct
    i32.eqz
    if
      unreachable
    end
    
    local.get $struct
    return
  )

  (func $itod (param $num i32) (result f64)
    local.get $num
    f64.convert_i32_s
    return
  )
  
  (func $dtoi (param $num f64) (result i32)
    local.get $num
    i32.trunc_f64_s
    return
  )
  
  (func $length (param $arr i32) (result i32)
    local.get $arr
    i32.const 4
    i32.sub
    i32.load
  )

  (func $length_string (param $arr i32) (result i32)
    local.get $arr
    i32.const 4
    i32.sub
    i32.load
  )
  
  (func $error (param $str_array i32)
    unreachable
  )
  
  (func $get_array_pointer (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $array_int_to_string (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $string_to_array_int (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $delete_i32_array (param $delete_i32_array0_arr i32)
    local.get $delete_i32_array0_arr
    call $get_array_pointer
    i32.const 4
    i32.sub
    i32.const 4
    local.get $delete_i32_array0_arr
    call $length
    i32.const 1
    i32.add
    i32.mul
    call $deallocate_memory
    i32.const 0
    return
  )

  (func $delete_f64_array (param $delete_f64_array0_arr i32)
    local.get $delete_f64_array0_arr
    i32.const 4
    i32.sub
    
    i32.const 8
    local.get $delete_f64_array0_arr
    call $length
    i32.mul
    i32.const 1
    i32.add
    call $deallocate_memory
    i32.const 0
    return
  )
  ;; Used by the runtime to input user data
  (func $string_ini_assign (param $array i32) (param $index i32) (param $value i32) (result i32)    
    local.get $array
    local.get $index
    i32.const 4
    i32.mul
    i32.add
    local.get $value
    i32.store

    local.get $array
    return
  )

  ${generatePrintFunctions()}
  ${generate_array_functions(4, "i32", unsafe)}
  ${generate_array_functions(4, "f32", unsafe)}
  ${generate_array_functions(8, "f64", unsafe)}
  (func $allocate_struct (param $size i32) (result i32)
    (local $tmpOffset i32)
    local.get $size
    i32.const 4
    i32.add
    call $allocate_memory
    local.tee $tmpOffset
    
    local.get $size
    i32.store
    
    local.get $tmpOffset
    i32.const 4
    i32.add
  )

  (func $delete_struct (param $pointer i32)
    (local $length i32)

    local.get $pointer
    i32.const 4
    i32.sub
    i32.load
    local.set $length

    local.get $pointer
    i32.const 4
    i32.sub
    local.get $length
    i32.const 4
    i32.add
    call $deallocate_memory
    i32.const 0
    return
  )
  ${generate_struct_functions(4, "i32")}
  ${generate_struct_functions(8, "f64")}
  ${get_string_functions()}
`;
}

export const DATA_TYPES = {
  void: new ast.DataType(
    false,
    ast.Token(ast.TokenType.VOID_TYPE, "void", 0, 0),
    undefined
  ),
  string: new ast.DataType(
    false,
    ast.Token(ast.TokenType.STRING_TYPE, "string", 0, 0),
    undefined
  ),
  int: new ast.DataType(
    false,
    ast.Token(ast.TokenType.INT_TYPE, "int", 0, 0),
    undefined
  ),
  double: new ast.DataType(
    false,
    ast.Token(ast.TokenType.DOUBLE_TYPE, "double", 0, 0),
    undefined
  ),
  bool: new ast.DataType(
    false,
    ast.Token(ast.TokenType.BOOL_TYPE, "bool", 0, 0),
    undefined
  ),
  array_int: new ast.DataType(
    true,
    ast.Token(ast.TokenType.INT_TYPE, "int", 0, 0),
    undefined
  ),
  ANY_ARRAY: new ast.DataType(
    true,
    ast.Token(ast.TokenType.ID, "any", 0, 0),
    undefined
  ),
  ANY_STRUCT: new ast.DataType(
    true,
    ast.Token(ast.TokenType.ID, "any_struct", 0, 0),
    undefined
  ),
  String: new ast.DataType(
    false,
    ast.Token(ast.TokenType.ID, "String", 0, 0),
    undefined
  ),
};

// export const BUILT_IN_DEFINITION =
